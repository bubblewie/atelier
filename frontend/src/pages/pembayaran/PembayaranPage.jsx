import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import CustomerNavbar from "../../components/CustomerNavbar";
import CustomerFooter from "../../components/CustomerFooter";
import EmptyState from "../../components/common/EmptyState";
import Toast from "../../components/ui/Toast";
import Sticker, { StickerInline } from "../../components/common/Sticker";
import { SkeletonBox } from "../../components/ui/Skeleton";
import { formatRupiah } from "../../components/common/media";
import { getUser, isAdmin } from "../../lib/store";
import useBuktiPembayaran from "../../lib/useBuktiPembayaran";
import { orderItems } from "../../lib/order";
import {
    BANK_ACCOUNTS,
    EWALLET_ACCOUNTS,
    methodLabel,
    needsProof,
    paymentStatus,
} from "../../config/payment";
import "../CustomerPages.css";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB — sama dengan validasi backend
const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

/**
 * Halaman instruksi pembayaran + pengiriman bukti.
 *
 * Alur: order dibuat → halaman ini → customer transfer → unggah bukti →
 * status jadi `menunggu_verifikasi` → admin verifikasi → status jadi `lunas`.
 *
 * Nominal, kode transaksi, dan status semuanya dari `GET /pesanan/{id}`.
 * Rekening tujuan dibaca dari src/config/payment.js — bila belum diisi,
 * halaman menampilkan peringatan jujur, bukan rekening karangan.
 */
const PembayaranPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const fileRef = useRef(null);

    const [pesanan, setPesanan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState("");
    const [fileError, setFileError] = useState("");
    const [uploading, setUploading] = useState(false);

    const [copied, setCopied] = useState("");
    const [toast, setToast] = useState({ message: "", type: "success" });

    const user = getUser();

    // Bukti kini tersimpan di disk PRIVAT backend, jadi tidak bisa dipasang
    // langsung ke <img src>. Hook ini mengunduhnya lewat endpoint terproteksi
    // dan mengubahnya jadi object URL sementara.
    const bukti = useBuktiPembayaran(pesanan?.id_pesanan, Boolean(pesanan?.bukti_pembayaran));

    const showToast = useCallback((message, type = "success") => {
        setToast({ message, type });
        window.setTimeout(() => setToast({ message: "", type }), 3600);
    }, []);

    const fetchPesanan = useCallback(async () => {
        try {
            setLoading(true);
            setLoadError("");
            const response = await api.get(`/pesanan/${id}`);
            setPesanan(response.data?.data || null);
        } catch (error) {
            console.error("Gagal mengambil pesanan:", error);
            if (error.response?.status === 401) {
                navigate("/login", { state: { from: `/pembayaran/${id}` } });
                return;
            }
            setLoadError(
                error.response?.data?.message ||
                    "Detail pesanan belum bisa dimuat. Periksa koneksi ke server lalu coba lagi."
            );
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        if (id) fetchPesanan();
    }, [id, fetchPesanan]);

    /* Bersihkan object URL preview agar tidak bocor memori. */
    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    const status = paymentStatus(pesanan?.status_pembayaran);
    const metode = pesanan?.metode_pembayaran;
    const perluBukti = needsProof(metode);
    const sudahLunas = pesanan?.status_pembayaran === "lunas";
    const menunggu = pesanan?.status_pembayaran === "menunggu_verifikasi";
    const ditolak = pesanan?.status_pembayaran === "gagal";

    const tujuan = useMemo(() => {
        if (metode === "transfer_bank") {
            return BANK_ACCOUNTS.map((b) => ({
                judul: b.bank,
                nomor: b.nomor,
                atasNama: b.atasNama,
                isDemo: b.isDemo,
            }));
        }
        if (metode === "ewallet") {
            return EWALLET_ACCOUNTS.map((w) => ({
                judul: w.provider,
                nomor: w.nomor,
                atasNama: w.atasNama,
                isDemo: w.isDemo,
            }));
        }
        return [];
    }, [metode]);

    const salin = async (teks, tandaKunci) => {
        try {
            await navigator.clipboard.writeText(String(teks));
            setCopied(tandaKunci);
            window.setTimeout(() => setCopied(""), 1800);
        } catch {
            showToast("Browser memblokir penyalinan. Salin manual, ya.", "warning");
        }
    };

    const pilihFile = (e) => {
        const picked = e.target.files?.[0];
        if (!picked) return;

        setFileError("");

        if (!ACCEPTED.includes(picked.type)) {
            setFileError("Format harus JPG, PNG, atau WEBP.");
            return;
        }
        if (picked.size > MAX_SIZE) {
            setFileError(
                `Ukuran file ${(picked.size / 1024 / 1024).toFixed(1)} MB — maksimal 2 MB.`
            );
            return;
        }

        if (preview) URL.revokeObjectURL(preview);
        setFile(picked);
        setPreview(URL.createObjectURL(picked));
    };

    const kirimBukti = async () => {
        if (!file) {
            setFileError("Pilih file bukti pembayaran terlebih dahulu.");
            return;
        }

        const formData = new FormData();
        formData.append("bukti_pembayaran", file);

        try {
            setUploading(true);
            setFileError("");

            const response = await api.post(`/pesanan/${id}/bukti-pembayaran`, formData);

            setPesanan(response.data?.data || pesanan);

            // File sengaja TIDAK dibuang kalau gagal — hanya dibersihkan
            // setelah server benar-benar menerimanya.
            if (preview) URL.revokeObjectURL(preview);
            setFile(null);
            setPreview("");
            if (fileRef.current) fileRef.current.value = "";

            showToast("Bukti pembayaran terkirim. Menunggu verifikasi admin.", "success");
            await fetchPesanan();
        } catch (error) {
            console.error("Gagal mengunggah bukti:", error);

            if (error.response?.status === 401) {
                showToast("Sesi berakhir. Silakan masuk kembali.", "error");
                navigate("/login", { state: { from: `/pembayaran/${id}` } });
                return;
            }

            const errors = error.response?.data?.errors;
            setFileError(
                errors
                    ? Object.values(errors).flat().join(" ")
                    : error.response?.data?.message ||
                          "Gagal mengunggah bukti. Filemu masih tersimpan — silakan coba lagi."
            );
            showToast("Upload gagal. Filemu tidak hilang, coba kirim ulang.", "error");
        } finally {
            setUploading(false);
        }
    };

    /* ---------------------------------------------------------- render */

    if (loading) {
        return (
            <div className="customer-page-wrapper">
                <CustomerNavbar />
                <main className="page-main">
                    <div className="atelier-container" style={{ paddingTop: 40 }}>
                        <SkeletonBox height={120} radius="var(--radius-xl)" />
                        <div style={{ height: 20 }} />
                        <SkeletonBox height={320} radius="var(--radius-xl)" />
                    </div>
                </main>
                <CustomerFooter />
            </div>
        );
    }

    if (loadError || !pesanan) {
        return (
            <div className="customer-page-wrapper">
                <CustomerNavbar />
                <main className="page-main">
                    <div className="atelier-container">
                        <EmptyState
                            tone="error"
                            title="Pesanan tidak ditemukan"
                            description={loadError || "Pesanan ini tidak tersedia untuk akunmu."}
                            action={
                                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                                    <button className="btn btn-primary" onClick={fetchPesanan}>
                                        Coba lagi
                                    </button>
                                    <button className="btn btn-outline" onClick={() => navigate("/customer/pesanan-saya")}>
                                        Ke daftar pesanan
                                    </button>
                                </div>
                            }
                        />
                    </div>
                </main>
                <CustomerFooter />
            </div>
        );
    }

    return (
        <div className="customer-page-wrapper">
            <CustomerNavbar />

            <main className="page-main">
                <div className="atelier-container">
                    <header className="page-head">
                        <Sticker name="sparkle" size={30} rotate={-12} float style={{ top: 30, right: "6%" }} />
                        <button className="back-link" onClick={() => navigate("/customer/pesanan-saya")}>
                            <i className="bi bi-arrow-left" aria-hidden="true" /> Pesanan saya
                        </button>
                        <span className="eyebrow">Pembayaran</span>
                        <h1>Pesanan #{pesanan.id_pesanan}</h1>
                        <p>{pesanan.kode_transaksi}</p>
                    </header>

                    {/* ── Status ── */}
                    <div className="card" style={{ marginBottom: 26 }}>
                        <div className="row-between">
                            <div>
                                <span className={`badge ${status.badge}`}>{status.label}</span>
                                <p style={{ marginTop: 10, color: "var(--text-muted)", fontSize: 14.5 }}>
                                    {status.deskripsi}
                                </p>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div className="caption">Total tagihan</div>
                                <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, color: "var(--text-heading)" }}>
                                    Rp {formatRupiah(pesanan.total_harga)}
                                </div>
                            </div>
                        </div>

                        {ditolak && pesanan.alasan_penolakan && (
                            <div
                                className="note-card"
                                style={{ marginTop: 18, background: "var(--error-bg)", borderColor: "transparent" }}
                            >
                                <strong style={{ display: "block", marginBottom: 4 }}>Alasan penolakan</strong>
                                {pesanan.alasan_penolakan}
                            </div>
                        )}
                    </div>

                    <div className="cart-layout">
                        {/* ── Instruksi ── */}
                        <div>
                            <div className="panel" style={{ marginBottom: 24 }}>
                                <div className="panel-head">
                                    <h3>
                                        <StickerInline name="pen" size={18} /> Cara membayar —{" "}
                                        {methodLabel(metode)}
                                    </h3>
                                </div>
                                <div className="panel-body">
                                    {metode === "cod" ? (
                                        <p style={{ color: "var(--text-muted)" }}>
                                            Pesanan ini dibayar tunai saat paket diterima. Tidak ada transfer
                                            yang perlu kamu lakukan sekarang — siapkan uang pas sejumlah
                                            <strong> Rp {formatRupiah(pesanan.total_harga)}</strong>.
                                        </p>
                                    ) : tujuan.length === 0 ? (
                                        <div className="note-card" style={{ background: "var(--warning-bg)", borderColor: "transparent" }}>
                                            <strong style={{ display: "block", marginBottom: 6 }}>
                                                Rekening tujuan belum dikonfigurasi
                                            </strong>
                                            Isi <code>src/config/payment.js</code> dengan data rekening
                                            {metode === "ewallet" ? " e-wallet" : " bank"} yang asli. Sampai
                                            itu diisi, kami tidak menampilkan nomor apa pun di sini.
                                        </div>
                                    ) : (
                                        <>
                                            <p style={{ color: "var(--text-muted)", marginBottom: 18, fontSize: 14.5 }}>
                                                Transfer <strong>tepat sejumlah</strong> nominal di bawah ke salah
                                                satu tujuan berikut, lalu unggah bukti transfernya.
                                            </p>

                                            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                                                {tujuan.map((t) => (
                                                    <div key={t.judul + t.nomor} className="option-card" style={{ cursor: "default" }}>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <span className="option-card-title">
                                                                {t.judul}
                                                                {t.isDemo && (
                                                                    <span
                                                                        className="badge badge-warning"
                                                                        style={{ marginLeft: 8, fontSize: 10 }}
                                                                    >
                                                                        Demo
                                                                    </span>
                                                                )}
                                                            </span>
                                                            <span
                                                                style={{
                                                                    display: "block",
                                                                    fontFamily: "var(--font-display)",
                                                                    fontSize: 19,
                                                                    letterSpacing: "0.04em",
                                                                    color: "var(--text-heading)",
                                                                }}
                                                            >
                                                                {t.nomor}
                                                            </span>
                                                            <span className="option-card-desc">a.n. {t.atasNama}</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="btn btn-mint btn-xs"
                                                            onClick={() => salin(t.nomor, t.judul)}
                                                        >
                                                            <i className="bi bi-clipboard" aria-hidden="true" />
                                                            {copied === t.judul ? "Tersalin" : "Salin"}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="option-card" style={{ cursor: "default", background: "var(--mint-25)" }}>
                                                <div style={{ flex: 1 }}>
                                                    <span className="option-card-desc">Nominal transfer</span>
                                                    <span
                                                        style={{
                                                            display: "block",
                                                            fontFamily: "var(--font-display)",
                                                            fontSize: 22,
                                                            fontWeight: 600,
                                                            color: "var(--text-heading)",
                                                        }}
                                                    >
                                                        Rp {formatRupiah(pesanan.total_harga)}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn btn-mint btn-xs"
                                                    onClick={() => salin(pesanan.total_harga, "nominal")}
                                                >
                                                    <i className="bi bi-clipboard" aria-hidden="true" />
                                                    {copied === "nominal" ? "Tersalin" : "Salin"}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* ── Upload bukti ── */}
                            {perluBukti && !sudahLunas && (
                                <div className="panel">
                                    <div className="panel-head">
                                        <h3>
                                            <StickerInline name="heart" size={18} /> Kirim bukti pembayaran
                                        </h3>
                                    </div>
                                    <div className="panel-body">
                                        {menunggu && (
                                            <div className="note-card" style={{ marginBottom: 18 }}>
                                                Bukti kamu sudah masuk dan sedang diperiksa. Kamu masih bisa
                                                mengunggah ulang kalau ternyata salah file.
                                            </div>
                                        )}

                                        <label className="form-file" htmlFor="bukti-input">
                                            <StickerInline name="sparkle" size={26} />
                                            <div style={{ marginTop: 8, fontFamily: "var(--font-display)", color: "var(--text-heading)" }}>
                                                {file ? file.name : "Pilih foto bukti transfer"}
                                            </div>
                                            <div className="form-hint">JPG, PNG, atau WEBP — maksimal 2 MB</div>
                                            <input
                                                id="bukti-input"
                                                ref={fileRef}
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                onChange={pilihFile}
                                                disabled={uploading}
                                            />
                                        </label>

                                        {fileError && <p className="form-error">{fileError}</p>}

                                        {preview && (
                                            <div style={{ marginTop: 18 }}>
                                                <span className="form-label">Pratinjau</span>
                                                <img
                                                    src={preview}
                                                    alt="Pratinjau bukti pembayaran"
                                                    style={{
                                                        width: "100%",
                                                        maxWidth: 320,
                                                        borderRadius: "var(--radius-lg)",
                                                        border: "1px solid var(--border-color)",
                                                    }}
                                                />
                                            </div>
                                        )}

                                        <div style={{ display: "flex", gap: 12, marginTop: 22, flexWrap: "wrap" }}>
                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                onClick={kirimBukti}
                                                disabled={uploading || !file}
                                            >
                                                {uploading && <span className="spin" />}
                                                {uploading ? "Mengirim..." : "Kirim bukti"}
                                            </button>
                                            {file && !uploading && (
                                                <button
                                                    type="button"
                                                    className="btn btn-ghost"
                                                    onClick={() => {
                                                        if (preview) URL.revokeObjectURL(preview);
                                                        setFile(null);
                                                        setPreview("");
                                                        setFileError("");
                                                        if (fileRef.current) fileRef.current.value = "";
                                                    }}
                                                >
                                                    Ganti file
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Bukti yang sudah tersimpan di server */}
                            {pesanan.bukti_pembayaran && (
                                <div className="panel" style={{ marginTop: 24 }}>
                                    <div className="panel-head">
                                        <h3>Bukti yang sudah dikirim</h3>
                                    </div>
                                    <div className="panel-body">
                                        {bukti.loading ? (
                                            <SkeletonBox height={220} radius="var(--radius-lg)" />
                                        ) : bukti.error ? (
                                            <p className="form-error">{bukti.error}</p>
                                        ) : (
                                            <img
                                                src={bukti.url}
                                                alt="Bukti pembayaran yang sudah dikirim"
                                                style={{
                                                    width: "100%",
                                                    maxWidth: 340,
                                                    borderRadius: "var(--radius-lg)",
                                                    border: "1px solid var(--border-color)",
                                                    objectFit: "contain",
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Ringkasan pesanan ── */}
                        <aside className="summary-card">
                            <h3>Rincian pesanan</h3>

                            {orderItems(pesanan).map((item) => (
                                <div className="mini-line" key={item.key}>
                                    <span>
                                        {item.nama} × {item.jumlah}
                                    </span>
                                    <span>Rp {formatRupiah(item.subtotal)}</span>
                                </div>
                            ))}

                            <div className="summary-total">
                                <span>Total</span>
                                <strong>Rp {formatRupiah(pesanan.total_harga)}</strong>
                            </div>

                            <div className="summary-line">
                                <span>Metode</span>
                                <span>{methodLabel(metode)}</span>
                            </div>
                            <div className="summary-line">
                                <span>Pengiriman</span>
                                <span>{pesanan.status_pengiriman || "—"}</span>
                            </div>

                            <button
                                type="button"
                                className="btn btn-outline btn-block"
                                style={{ marginTop: 12 }}
                                onClick={fetchPesanan}
                            >
                                <i className="bi bi-arrow-clockwise" aria-hidden="true" />
                                Perbarui status
                            </button>

                            {isAdmin(user) && (
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-block"
                                    style={{ marginTop: 8 }}
                                    onClick={() => navigate(`/pesanan/detail/${pesanan.id_pesanan}`)}
                                >
                                    Buka di panel admin
                                </button>
                            )}
                        </aside>
                    </div>
                </div>
            </main>

            <CustomerFooter />

            <div className="toast-container">
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ message: "", type: "success" })}
                />
            </div>
        </div>
    );
};

export default PembayaranPage;
