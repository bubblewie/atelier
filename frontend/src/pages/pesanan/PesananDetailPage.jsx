import React, { useCallback, useEffect, useState } from "react";
import { orderItems } from "../../lib/order";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import Toast from "../../components/ui/Toast";
import EmptyState from "../../components/common/EmptyState";
import { SkeletonBox } from "../../components/ui/Skeleton";
import { StickerInline } from "../../components/common/Sticker";
import { productImage, formatRupiah, handleImageError } from "../../components/common/media";
import "../AdminPages.css";
import "../CustomerPages.css";


const BAYAR = ["pending", "lunas", "gagal"];
const KIRIM = ["dikemas", "dikirim", "selesai", "dibatalkan"];

const STATUS_TONE = {
    lunas: "badge-success",
    selesai: "badge-success",
    pending: "badge-warning",
    dikemas: "badge-warning",
    dikirim: "badge-info",
    gagal: "badge-error",
    dibatalkan: "badge-error",
};

const tone = (value) => STATUS_TONE[String(value || "").toLowerCase()] || "badge-mint";

const PesananDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [pesanan, setPesanan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [saving, setSaving] = useState(false);
    const [statusPembayaran, setStatusPembayaran] = useState("pending");
    const [statusPengiriman, setStatusPengiriman] = useState("dikemas");
    const [toast, setToast] = useState({ message: "", type: "success" });

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        window.setTimeout(() => setToast({ message: "", type }), 3400);
    };

    const fetchPesanan = useCallback(async () => {
        try {
            setLoading(true);
            setNotFound(false);

            const response = await api.get(`/pesanan/${id}`);
            const data = response.data?.data;

            if (!data) {
                setNotFound(true);
                return;
            }

            setPesanan(data);
            setStatusPembayaran(data.status_pembayaran || "pending");
            setStatusPengiriman(data.status_pengiriman || "dikemas");
        } catch (error) {
            console.error("Gagal mengambil detail pesanan:", error);
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchPesanan();
    }, [id, fetchPesanan]);

    const handleUpdateStatus = async () => {
        try {
            setSaving(true);
            await api.put(`/pesanan/${id}/status`, {
                status_pembayaran: statusPembayaran,
                status_pengiriman: statusPengiriman,
            });
            showToast("Status pesanan berhasil diperbarui.", "success");
            await fetchPesanan();
        } catch (error) {
            console.error("Gagal update status:", error);
            showToast(error.response?.data?.message || "Status gagal diperbarui.", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="stack gap-20">
                <SkeletonBox width="34%" height={30} />
                <SkeletonBox height={320} radius="var(--radius-xl)" />
            </div>
        );
    }

    if (notFound || !pesanan) {
        return (
            <EmptyState
                tone="error"
                title="Pesanan tidak ditemukan"
                description="Pesanan ini mungkin sudah dihapus atau ID-nya tidak valid."
                action={
                    <button className="btn btn-primary" onClick={() => navigate("/pesanan")}>
                        Kembali ke daftar pesanan
                    </button>
                }
            />
        );
    }

    const lines = orderItems(pesanan);
    const changed =
        statusPembayaran !== (pesanan.status_pembayaran || "pending") ||
        statusPengiriman !== (pesanan.status_pengiriman || "dikemas");

    return (
        <div>
            <header className="admin-head">
                <div>
                    <button className="back-link" onClick={() => navigate("/pesanan")} type="button">
                        <i className="bi bi-arrow-left" aria-hidden="true" />
                        Kembali ke pesanan
                    </button>
                    <h1>Pesanan #{pesanan.id_pesanan}</h1>
                    <p>
                        Dibuat{" "}
                        {pesanan.created_at
                            ? new Date(pesanan.created_at).toLocaleString("id-ID", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                              })
                            : "—"}
                    </p>
                </div>

                <div className="admin-head-actions">
                    <span className={`badge ${tone(pesanan.status_pembayaran)}`}>
                        {pesanan.status_pembayaran || "pending"}
                    </span>
                    <span className={`badge ${tone(pesanan.status_pengiriman)}`}>
                        {pesanan.status_pengiriman || "dikemas"}
                    </span>
                </div>
            </header>

            <div className="checkout-layout">
                <div>
                    {/* ── customer ── */}
                    <section className="card" style={{ marginBottom: 22 }}>
                        <div className="field-set-title">
                            <StickerInline name="heart" size={20} /> Pelanggan
                        </div>

                        <div className="form-grid-2">
                            <div>
                                <div className="admin-stat-label">Nama</div>
                                <div className="cell-strong" style={{ marginBottom: 14 }}>
                                    {pesanan.user?.nama || pesanan.user?.name || `User #${pesanan.id_user}`}
                                </div>
                            </div>
                            <div>
                                <div className="admin-stat-label">Email</div>
                                <div style={{ marginBottom: 14, overflowWrap: "anywhere" }}>
                                    {pesanan.user?.email || "—"}
                                </div>
                            </div>
                            <div>
                                <div className="admin-stat-label">Telepon</div>
                                <div style={{ marginBottom: 14 }}>{pesanan.user?.no_telepon || "—"}</div>
                            </div>
                            <div>
                                <div className="admin-stat-label">Metode pembayaran</div>
                                <div style={{ marginBottom: 14 }}>{pesanan.metode_pembayaran || "—"}</div>
                            </div>
                        </div>

                        <div>
                            <div className="admin-stat-label">Alamat pengiriman</div>
                            <div>{pesanan.user?.alamat || "—"}</div>
                        </div>

                        {pesanan.catatan && (
                            <div className="note-card" style={{ marginTop: 18 }}>
                                <strong style={{ display: "block", marginBottom: 4 }}>Catatan pelanggan</strong>
                                {pesanan.catatan}
                            </div>
                        )}
                    </section>

                    {/* ── items ── */}
                    <section className="card">
                        <div className="field-set-title">
                            <StickerInline name="pen" size={20} /> Produk dipesan
                        </div>

                        {lines.length === 0 ? (
                            <div className="state-inline">Rincian produk tidak tersedia untuk pesanan ini.</div>
                        ) : (
                            lines.map((item) => {
                                const prod = item.produk || {};

                                return (
                                    <div className="order-item" key={item.key}>
                                        <img
                                            className="order-item-img"
                                            src={productImage(prod, { width: 160, height: 160 })}
                                            onError={handleImageError(prod)}
                                            alt={item.nama}
                                            loading="lazy"
                                        />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div className="order-item-name">{item.nama}</div>
                                            <div className="order-item-qty">
                                                {item.jumlah} pcs × Rp {formatRupiah(item.hargaSatuan)}
                                            </div>
                                        </div>
                                        <strong style={{ fontFamily: "var(--font-display)", fontSize: 15.5 }}>
                                            Rp {formatRupiah(item.subtotal)}
                                        </strong>
                                    </div>
                                );
                            })
                        )}
                    </section>
                </div>

                {/* ── status panel ── */}
                <aside className="summary-card">
                    <h3>Perbarui status</h3>

                    <div className="form-group">
                        <label className="form-label" htmlFor="pd-bayar">
                            Status pembayaran
                        </label>
                        <select
                            id="pd-bayar"
                            className="form-select"
                            value={statusPembayaran}
                            onChange={(e) => setStatusPembayaran(e.target.value)}
                            disabled={saving}
                        >
                            {BAYAR.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="pd-kirim">
                            Status pengiriman
                        </label>
                        <select
                            id="pd-kirim"
                            className="form-select"
                            value={statusPengiriman}
                            onChange={(e) => setStatusPengiriman(e.target.value)}
                            disabled={saving}
                        >
                            {KIRIM.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        className="btn btn-primary btn-block"
                        onClick={handleUpdateStatus}
                        disabled={saving || !changed}
                    >
                        {saving && <span className="spin" />}
                        {saving ? "Menyimpan…" : changed ? "Simpan perubahan" : "Tidak ada perubahan"}
                    </button>

                    <div className="summary-total" style={{ marginTop: 24 }}>
                        <span>Total pesanan</span>
                        <strong>Rp {formatRupiah(pesanan.total_harga)}</strong>
                    </div>

                    {pesanan.kode_transaksi && (
                        <p className="caption" style={{ textAlign: "center" }}>
                            Kode transaksi: {pesanan.kode_transaksi}
                        </p>
                    )}
                </aside>
            </div>

            <div className="toast-container">
                <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />
            </div>
        </div>
    );
};

export default PesananDetailPage;
