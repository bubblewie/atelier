import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import CustomerNavbar from "../../components/CustomerNavbar";
import CustomerFooter from "../../components/CustomerFooter";
import EmptyState from "../../components/common/EmptyState";
import { SkeletonBox } from "../../components/ui/Skeleton";
import Toast from "../../components/ui/Toast";
import { formatRupiah } from "../../components/common/media";
import { getUserId } from "../../lib/store";
import { paymentStatus, needsProof } from "../../config/payment";
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

const FILTERS = [
    { id: "semua", label: "Semua" },
    { id: "dikemas", label: "Dikemas" },
    { id: "dikirim", label: "Dikirim" },
    { id: "selesai", label: "Selesai" },
    { id: "dibatalkan", label: "Dibatalkan" },
];

const PesananSayaPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [pesanan, setPesanan] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("semua");
    const [toast, setToast] = useState({ message: "", type: "success" });

    const fetchPesanan = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const idUser = getUserId();
            if (!idUser) {
                setError("Kami tidak menemukan sesi kamu. Silakan masuk kembali.");
                return;
            }

            const response = await api.get(`/pesanan/user/${idUser}`);
            setPesanan(response.data?.data || []);
        } catch (err) {
            console.error("Gagal mengambil pesanan:", err);
            setError(err.response?.data?.message || "Daftar pesanan belum bisa dimuat.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPesanan();
    }, [fetchPesanan]);

    /* Success confirmation after a fresh checkout. */
    useEffect(() => {
        if (!location.state?.justPlaced) return;
        setToast({ message: "Pesanan berhasil dibuat!", type: "success" });
        window.setTimeout(() => setToast({ message: "", type: "success" }), 3800);
    }, [location.state]);

    const hasil = useMemo(() => {
        const sorted = [...pesanan].sort(
            (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
        );
        if (filter === "semua") return sorted;
        return sorted.filter((p) => String(p.status_pengiriman || "").toLowerCase() === filter);
    }, [pesanan, filter]);

    return (
        <div className="customer-page-wrapper">
            <CustomerNavbar />

            <main className="page-main">
                <div className="atelier-container">
                    <header className="page-head">
                        <span className="eyebrow">Riwayat</span>
                        <h1>Pesanan saya</h1>
                        <p>Lacak status pembayaran dan pengiriman setiap pesanan.</p>
                    </header>

                    {!loading && !error && pesanan.length > 0 && (
                        <div className="catalog-filters" style={{ marginBottom: 26 }}>
                            {FILTERS.map((f) => (
                                <button
                                    key={f.id}
                                    type="button"
                                    className={`filter-pill ${filter === f.id ? "active" : ""}`}
                                    onClick={() => setFilter(f.id)}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {loading ? (
                        <div className="stack gap-16">
                            <SkeletonBox height={108} radius="var(--radius-xl)" />
                            <SkeletonBox height={108} radius="var(--radius-xl)" />
                            <SkeletonBox height={108} radius="var(--radius-xl)" />
                        </div>
                    ) : error ? (
                        <EmptyState
                            tone="error"
                            title="Pesanan belum bisa dimuat"
                            description={error}
                            action={
                                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                                    <button className="btn btn-primary" onClick={fetchPesanan}>
                                        Coba lagi
                                    </button>
                                    <button className="btn btn-outline" onClick={() => navigate("/login")}>
                                        Masuk
                                    </button>
                                </div>
                            }
                        />
                    ) : pesanan.length === 0 ? (
                        <EmptyState
                            title="Belum ada pesanan"
                            description="Setelah kamu menyelesaikan checkout, pesanan akan tercatat di sini."
                            action={
                                <button className="btn btn-primary" onClick={() => navigate("/customer/produk")}>
                                    Mulai belanja
                                </button>
                            }
                        />
                    ) : hasil.length === 0 ? (
                        <EmptyState
                            title="Tidak ada pesanan dengan status ini"
                            description="Coba pilih filter lain untuk melihat pesanan yang tersedia."
                            action={
                                <button className="btn btn-primary" onClick={() => setFilter("semua")}>
                                    Tampilkan semua
                                </button>
                            }
                        />
                    ) : (
                        <div className="stack gap-16">
                            {hasil.map((item) => (
                                <article className="order-card" key={item.id_pesanan}>
                                    <div>
                                        <div className="order-tags">
                                            <span className="badge badge-cocoa">Pesanan #{item.id_pesanan}</span>
                                            <span className={`badge ${paymentStatus(item.status_pembayaran).badge}`}>
                                                {paymentStatus(item.status_pembayaran).label}
                                            </span>
                                            <span className={`badge ${tone(item.status_pengiriman)}`}>
                                                {item.status_pengiriman || "dikemas"}
                                            </span>
                                        </div>

                                        <div className="order-meta">
                                            <span>
                                                Tanggal:{" "}
                                                <strong>
                                                    {item.created_at
                                                        ? new Date(item.created_at).toLocaleDateString("id-ID", {
                                                              day: "numeric",
                                                              month: "long",
                                                              year: "numeric",
                                                          })
                                                        : "—"}
                                                </strong>
                                            </span>
                                            <span>
                                                Pembayaran: <strong>{item.metode_pembayaran || "—"}</strong>
                                            </span>
                                            {item.kode_transaksi && (
                                                <span>
                                                    Kode: <strong>{item.kode_transaksi}</strong>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="order-amount">
                                        <span className="value">Rp {formatRupiah(item.total_harga)}</span>
                                        {item.status_pembayaran !== "lunas" && needsProof(item.metode_pembayaran) && (
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => navigate(`/pembayaran/${item.id_pesanan}`)}
                                            >
                                                {item.status_pembayaran === "menunggu_verifikasi"
                                                    ? "Lihat pembayaran"
                                                    : "Bayar sekarang"}
                                            </button>
                                        )}

                                        <button
                                            className="btn btn-mint btn-sm"
                                            onClick={() => navigate(`/customer/pesanan/${item.id_pesanan}`)}
                                        >
                                            Lihat detail
                                            <i className="bi bi-arrow-right" aria-hidden="true" />
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
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

export default PesananSayaPage;
