import React, { useEffect, useState } from "react";
import useBuktiPembayaran from "../../lib/useBuktiPembayaran";
import { SkeletonBox } from "../ui/Skeleton";
import { StickerInline } from "./Sticker";
import { formatRupiah } from "./media";
import { methodLabel, paymentStatus } from "../../config/payment";

/**
 * Panel pemeriksaan bukti pembayaran untuk admin.
 *
 * Admin melihat buktinya dulu, baru memutuskan. Menolak WAJIB disertai
 * alasan — tombolnya tetap nonaktif sampai alasan diisi, sama seperti
 * validasi di backend.
 *
 * @param {object}   pesanan    record pesanan dari API
 * @param {function} onVerify   () => Promise
 * @param {function} onReject   (alasan) => Promise
 * @param {function} onClose
 * @param {boolean}  saving
 */
const BuktiPembayaranModal = ({ pesanan, onVerify, onReject, onClose, saving = false }) => {
    const [mode, setMode] = useState("lihat"); // "lihat" | "tolak"
    const [alasan, setAlasan] = useState("");
    const [zoom, setZoom] = useState(false);

    const punyaBukti = Boolean(pesanan?.bukti_pembayaran);
    const { url, loading, error } = useBuktiPembayaran(pesanan?.id_pesanan, punyaBukti);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== "Escape" || saving) return;
            if (zoom) setZoom(false);
            else onClose?.();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [zoom, saving, onClose]);

    if (!pesanan) return null;

    const status = paymentStatus(pesanan.status_pembayaran);
    const items = pesanan.detail || pesanan.detail_pesanan || [];
    const alasanValid = alasan.trim().length >= 5;

    return (
        <div className="modal-backdrop" onClick={() => !saving && onClose?.()}>
            <div
                className="modal-card"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={`Bukti pembayaran pesanan ${pesanan.id_pesanan}`}
            >
                <button className="modal-close" onClick={onClose} disabled={saving} aria-label="Tutup" type="button">
                    <i className="bi bi-x-lg" aria-hidden="true" />
                </button>

                <div className="bukti-layout">
                    {/* ── Kiri: bukti ── */}
                    <div className="bukti-media">
                        {!punyaBukti ? (
                            <div className="bukti-kosong">
                                <StickerInline name="leaf" size={44} />
                                <p>Customer belum mengunggah bukti pembayaran.</p>
                            </div>
                        ) : loading ? (
                            <SkeletonBox height={360} radius="var(--radius-lg)" />
                        ) : error ? (
                            <div className="bukti-kosong">
                                <StickerInline name="star" size={40} />
                                <p>{error}</p>
                            </div>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    className="bukti-thumb"
                                    onClick={() => setZoom(true)}
                                    aria-label="Perbesar bukti pembayaran"
                                >
                                    <img src={url} alt="Bukti pembayaran dari customer" />
                                </button>
                                <div className="bukti-tools">
                                    <button type="button" className="btn btn-outline btn-xs" onClick={() => setZoom(true)}>
                                        <i className="bi bi-zoom-in" aria-hidden="true" /> Perbesar
                                    </button>
                                    <a
                                        className="btn btn-ghost btn-xs"
                                        href={url}
                                        download={`bukti-pesanan-${pesanan.id_pesanan}.jpg`}
                                    >
                                        <i className="bi bi-download" aria-hidden="true" /> Unduh
                                    </a>
                                </div>
                            </>
                        )}
                    </div>

                    {/* ── Kanan: detail + aksi ── */}
                    <div className="bukti-detail">
                        <span className="eyebrow">Pemeriksaan pembayaran</span>
                        <h3 style={{ margin: "8px 0 4px" }}>Pesanan #{pesanan.id_pesanan}</h3>
                        <p className="caption" style={{ marginBottom: 16 }}>{pesanan.kode_transaksi}</p>

                        <span className={`badge ${status.badge}`}>{status.label}</span>

                        <div className="dotted-rule" style={{ margin: "18px 0" }} />

                        <div className="summary-line">
                            <span>Customer</span>
                            <span>{pesanan.user?.nama || pesanan.user?.name || `User #${pesanan.id_user}`}</span>
                        </div>
                        <div className="summary-line">
                            <span>Tanggal pesanan</span>
                            <span>
                                {pesanan.created_at || pesanan.tanggal_transaksi
                                    ? new Date(pesanan.created_at || pesanan.tanggal_transaksi).toLocaleString("id-ID")
                                    : "—"}
                            </span>
                        </div>
                        <div className="summary-line">
                            <span>Metode</span>
                            <span>{methodLabel(pesanan.metode_pembayaran)}</span>
                        </div>
                        <div className="summary-line">
                            <span>Dibayar pada</span>
                            <span>
                                {pesanan.tanggal_pembayaran
                                    ? new Date(pesanan.tanggal_pembayaran).toLocaleString("id-ID")
                                    : "—"}
                            </span>
                        </div>

                        <div className="dotted-rule" style={{ margin: "16px 0" }} />

                        {items.map((d, i) => (
                            <div className="mini-line" key={d.id_detail ?? i}>
                                <span>
                                    {d.produk?.nama_produk || `Produk #${d.id_produk}`} × {d.jumlah}
                                </span>
                                <span>Rp {formatRupiah(d.subtotal ?? d.harga_satuan * d.jumlah)}</span>
                            </div>
                        ))}

                        <div className="summary-total">
                            <span>Total</span>
                            <strong>Rp {formatRupiah(pesanan.total_harga)}</strong>
                        </div>

                        {pesanan.alasan_penolakan && (
                            <div
                                className="note-card"
                                style={{ background: "var(--error-bg)", borderColor: "transparent", marginBottom: 16 }}
                            >
                                <strong style={{ display: "block", marginBottom: 4 }}>Alasan penolakan tercatat</strong>
                                {pesanan.alasan_penolakan}
                            </div>
                        )}

                        {/* ── Aksi ── */}
                        {mode === "lihat" ? (
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                {pesanan.status_pembayaran !== "lunas" && (
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        style={{ flex: "1 1 160px" }}
                                        onClick={onVerify}
                                        disabled={saving}
                                    >
                                        {saving && <span className="spin" />}
                                        Verifikasi pembayaran
                                    </button>
                                )}
                                {pesanan.status_pembayaran !== "gagal" && (
                                    <button
                                        type="button"
                                        className="btn btn-danger"
                                        onClick={() => setMode("tolak")}
                                        disabled={saving}
                                    >
                                        Tolak
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div>
                                <label className="form-label" htmlFor="alasan-tolak">
                                    Alasan penolakan (wajib)
                                </label>
                                <textarea
                                    id="alasan-tolak"
                                    className="form-textarea"
                                    rows="3"
                                    value={alasan}
                                    onChange={(e) => setAlasan(e.target.value)}
                                    placeholder="Contoh: nominal transfer tidak sesuai total pesanan."
                                    disabled={saving}
                                    autoFocus
                                />
                                <p className="form-hint">
                                    Alasan ini akan dibaca customer di halaman pembayarannya. Minimal 5 karakter.
                                </p>

                                <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                                    <button
                                        type="button"
                                        className="btn btn-danger"
                                        onClick={() => onReject?.(alasan.trim())}
                                        disabled={saving || !alasanValid}
                                    >
                                        {saving && <span className="spin" />}
                                        {saving ? "Menyimpan..." : "Konfirmasi penolakan"}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-ghost"
                                        onClick={() => setMode("lihat")}
                                        disabled={saving}
                                    >
                                        Batal
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Zoom penuh ── */}
            {zoom && url && (
                <div
                    className="bukti-zoom"
                    onClick={(e) => {
                        e.stopPropagation();
                        setZoom(false);
                    }}
                    role="dialog"
                    aria-label="Bukti pembayaran diperbesar"
                >
                    <img src={url} alt="Bukti pembayaran ukuran penuh" />
                    <button type="button" className="modal-close" onClick={() => setZoom(false)} aria-label="Tutup">
                        <i className="bi bi-x-lg" aria-hidden="true" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default BuktiPembayaranModal;
