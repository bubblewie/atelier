import React, { useCallback, useEffect, useState } from "react";
import { orderItems } from "../../lib/order";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import CustomerNavbar from "../../components/CustomerNavbar";
import CustomerFooter from "../../components/CustomerFooter";
import EmptyState from "../../components/common/EmptyState";
import { SkeletonBox } from "../../components/ui/Skeleton";
import Toast from "../../components/ui/Toast";
import { StickerInline } from "../../components/common/Sticker";
import { productImage, formatRupiah, handleImageError } from "../../components/common/media";
import "../CustomerPages.css";


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

const FLOW = ["dikemas", "dikirim", "selesai"];

const PesananDetailCustomerPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();

    const [pesanan, setPesanan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [toast, setToast] = useState({ message: "", type: "success" });

    const fetchDetail = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const response = await api.get(`/pesanan/${id}`);
            setPesanan(response.data?.data || null);
        } catch (err) {
            console.error("Gagal mengambil detail pesanan:", err);
            setError(err.response?.data?.message || "Detail pesanan belum bisa dimuat.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchDetail();
    }, [id, fetchDetail]);

    useEffect(() => {
        if (!location.state?.justPlaced) return;
        setToast({ message: "Pesanan berhasil dibuat!", type: "success" });
        window.setTimeout(() => setToast({ message: "", type: "success" }), 4200);
    }, [location.state]);

    const status = String(pesanan?.status_pengiriman || "dikemas").toLowerCase();
    const cancelled = status === "dibatalkan";
    const activeIndex = FLOW.indexOf(status);

    // The API exposes line items under either key depending on the endpoint.
    const lines = orderItems(pesanan);

    return (
        <div className="customer-page-wrapper">
            <CustomerNavbar />

            <main className="page-main">
                <div className="atelier-container">
                    <div style={{ paddingTop: 32 }}>
                        <button className="back-link" onClick={() => navigate("/customer/pesanan-saya")}>
                            <i className="bi bi-arrow-left" aria-hidden="true" />
                            Kembali ke pesanan saya
                        </button>
                    </div>

                    {loading ? (
                        <div className="stack gap-24" style={{ paddingTop: 24 }}>
                            <SkeletonBox height={132} radius="var(--radius-xl)" />
                            <SkeletonBox height={260} radius="var(--radius-xl)" />
                        </div>
                    ) : error || !pesanan ? (
                        <EmptyState
                            tone="error"
                            title={error ? "Detail belum bisa dimuat" : "Pesanan tidak ditemukan"}
                            description={error || "Pesanan yang kamu cari tidak tersedia atau sudah dihapus."}
                            action={
                                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                                    <button className="btn btn-primary" onClick={fetchDetail}>
                                        Coba lagi
                                    </button>
                                    <button className="btn btn-outline" onClick={() => navigate("/customer/pesanan-saya")}>
                                        Daftar pesanan
                                    </button>
                                </div>
                            }
                        />
                    ) : (
                        <>
                            <header className="page-head" style={{ paddingTop: 18 }}>
                                <span className="eyebrow">Detail pesanan</span>
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
                            </header>

                            <div className="checkout-layout">
                                <div>
                                    {/* ── timeline ── */}
                                    <section className="card" style={{ marginBottom: 24 }}>
                                        <div className="field-set-title">
                                            <StickerInline name="leaf" size={20} /> Status pengiriman
                                        </div>

                                        {cancelled ? (
                                            <div className="timeline">
                                                <div className="timeline-step cancelled">
                                                    <div className="timeline-rail">
                                                        <span className="timeline-dot" />
                                                    </div>
                                                    <div className="timeline-label">Pesanan dibatalkan</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="timeline">
                                                {FLOW.map((step, i) => (
                                                    <div
                                                        key={step}
                                                        className={`timeline-step ${i <= activeIndex ? "done" : ""}`}
                                                    >
                                                        <div className="timeline-rail">
                                                            <span className="timeline-dot" />
                                                            <span className="timeline-bar" />
                                                        </div>
                                                        <div className="timeline-label">
                                                            {step === "dikemas" && "Pesanan sedang dikemas"}
                                                            {step === "dikirim" && "Dalam perjalanan"}
                                                            {step === "selesai" && "Pesanan selesai"}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </section>

                                    {/* ── items ── */}
                                    <section className="card">
                                        <div className="field-set-title">
                                            <StickerInline name="star" size={20} /> Produk dipesan
                                        </div>

                                        {lines.length === 0 ? (
                                            <div className="state-inline">Rincian produk tidak tersedia untuk pesanan ini.</div>
                                        ) : (
                                            lines.map((item) => {
                                                const p = item.produk || {};

                                                return (
                                                    <div className="order-item" key={item.key}>
                                                        <img
                                                            className="order-item-img"
                                                            src={productImage(p, { width: 160, height: 160 })}
                                                            onError={handleImageError(p)}
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

                                    {pesanan.catatan && (
                                        <div className="note-card" style={{ marginTop: 20 }}>
                                            <strong style={{ display: "block", marginBottom: 4 }}>Catatan kamu</strong>
                                            {pesanan.catatan}
                                        </div>
                                    )}
                                </div>

                                {/* ── summary ── */}
                                <aside className="summary-card">
                                    <h3>Ringkasan pembayaran</h3>

                                    <div className="summary-line">
                                        <span>Status pembayaran</span>
                                        <span>
                                            <span className={`badge ${tone(pesanan.status_pembayaran)}`}>
                                                {pesanan.status_pembayaran || "pending"}
                                            </span>
                                        </span>
                                    </div>

                                    <div className="summary-line">
                                        <span>Metode</span>
                                        <span>{pesanan.metode_pembayaran || "—"}</span>
                                    </div>

                                    {pesanan.kode_transaksi && (
                                        <div className="summary-line">
                                            <span>Kode transaksi</span>
                                            <span>{pesanan.kode_transaksi}</span>
                                        </div>
                                    )}

                                    <div className="summary-total">
                                        <span>Total</span>
                                        <strong>Rp {formatRupiah(pesanan.total_harga)}</strong>
                                    </div>

                                    <button className="btn btn-mint btn-block" onClick={() => navigate("/customer/produk")}>
                                        Belanja lagi
                                    </button>
                                </aside>
                            </div>
                        </>
                    )}
                </div>
            </main>

            <CustomerFooter />

            <div className="toast-container">
                <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />
            </div>
        </div>
    );
};

export default PesananDetailCustomerPage;
