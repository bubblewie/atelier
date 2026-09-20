import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import CustomerNavbar from "../../components/CustomerNavbar";
import CustomerFooter from "../../components/CustomerFooter";
import ProductCard from "../../components/common/ProductCard";
import Sticker, { StickerInline } from "../../components/common/Sticker";
import Character from "../../components/common/Character";
import { ProductSkeletonGrid, SkeletonBox } from "../../components/ui/Skeleton";
import Toast from "../../components/ui/Toast";
import { formatRupiah } from "../../components/common/media";
import { addToCart, cartCount, getUser, greeting, readCart, subscribeCart } from "../../lib/store";
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

const CustomerDashboardPage = () => {
    const navigate = useNavigate();

    const [user] = useState(getUser);
    const [pesanan, setPesanan] = useState([]);
    const [produk, setProduk] = useState([]);
    const [loadingPesanan, setLoadingPesanan] = useState(true);
    const [loadingProduk, setLoadingProduk] = useState(true);
    const [bagCount, setBagCount] = useState(() => cartCount(readCart()));
    const [toast, setToast] = useState({ message: "", type: "success" });

    const showToast = useCallback((message, type = "success") => {
        setToast({ message, type });
        window.setTimeout(() => setToast({ message: "", type }), 3200);
    }, []);

    /* Guard: ProtectedRoute already blocks anonymous access, this is a safety net. */
    useEffect(() => {
        if (!user) navigate("/login", { replace: true });
    }, [user, navigate]);

    useEffect(() => {
        const sync = () => setBagCount(cartCount(readCart()));
        sync();
        return subscribeCart(sync);
    }, []);

    useEffect(() => {
        const id = user?.id_user ?? user?.id;
        if (!id) {
            setLoadingPesanan(false);
            return;
        }

        (async () => {
            try {
                setLoadingPesanan(true);
                const response = await api.get(`/pesanan/user/${id}`);
                setPesanan(response.data?.data || []);
            } catch (error) {
                console.error("Gagal mengambil pesanan:", error);
                setPesanan([]);
            } finally {
                setLoadingPesanan(false);
            }
        })();
    }, [user]);

    useEffect(() => {
        (async () => {
            try {
                setLoadingProduk(true);
                const response = await api.get(`/produk`);
                setProduk(response.data?.data || []);
            } catch (error) {
                console.error("Gagal mengambil produk:", error);
                setProduk([]);
            } finally {
                setLoadingProduk(false);
            }
        })();
    }, []);

    const handleAdd = (item) => {
        const result = addToCart(item);
        if (!result.ok) {
            showToast(result.stok > 0 ? `Stok tinggal ${result.stok}` : "Produk sedang habis", "warning");
            return;
        }
        showToast(`${item.nama_produk} masuk keranjang`, "success");
    };

    const totalBelanja = pesanan.reduce((sum, p) => sum + Number(p.total_harga || 0), 0);
    const terbaru = [...pesanan]
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 3);

    return (
        <div className="customer-page-wrapper">
            <CustomerNavbar />

            <main className="page-main">
                <div className="atelier-container" style={{ paddingTop: 40 }}>
                    {/* ── greeting ── */}
                    <section className="dash-hero">
                        <Sticker name="flower" size={62} rotate={-12} float style={{ top: -18, right: 46 }} />
                        <Sticker name="sparkle" size={30} rotate={14} style={{ bottom: 24, right: 130 }} />

                        <span className="eyebrow">Akun saya</span>
                        <h1>
                            {greeting()}, {user?.nama || user?.name || "teman Atelier"}
                        </h1>
                        <p>Pantau pesanan, cek keranjang, dan temukan koleksi yang mungkin kamu suka.</p>

                        <div className="dash-hero-actions">
                            <button className="btn btn-primary" onClick={() => navigate("/customer/produk")}>
                                Lihat katalog
                                <i className="bi bi-arrow-right" aria-hidden="true" />
                            </button>
                            <button className="btn btn-outline" onClick={() => navigate("/customer/pesanan-saya")}>
                                Pesanan saya
                            </button>
                        </div>

                        {/* Karakter di sudut kanan welcome card. Di mobile
                            disembunyikan lewat .char-corner agar tidak
                            menabrak tombol — bukan dihapus dari DOM utama,
                            karakter tetap tampil di homepage. */}
                        <Character
                            id={3}
                            size={168}
                            rotate={-4}
                            float
                            className="char-corner"
                        />
                    </section>

                    {/* ── stats ── */}
                    <div className="stat-grid">
                        <button type="button" className="stat-card" onClick={() => navigate("/customer/pesanan-saya")}>
                            <span className="stat-icon">
                                <StickerInline name="star" size={26} />
                            </span>
                            <span>
                                <span className="stat-value">{loadingPesanan ? "—" : pesanan.length}</span>
                                <span className="stat-label">Total pesanan</span>
                            </span>
                        </button>

                        <button type="button" className="stat-card" onClick={() => navigate("/keranjang")}>
                            <span className="stat-icon" style={{ background: "var(--pink-50)" }}>
                                <StickerInline name="heart" size={26} />
                            </span>
                            <span>
                                <span className="stat-value">{bagCount}</span>
                                <span className="stat-label">Item di keranjang</span>
                            </span>
                        </button>

                        <div className="stat-card" style={{ cursor: "default" }}>
                            <span className="stat-icon" style={{ background: "var(--cream-100)" }}>
                                <StickerInline name="leaf" size={26} />
                            </span>
                            <span>
                                <span className="stat-value" style={{ fontSize: 21 }}>
                                    {loadingPesanan ? "—" : `Rp ${formatRupiah(totalBelanja)}`}
                                </span>
                                <span className="stat-label">Total belanja</span>
                            </span>
                        </div>
                    </div>

                    {/* ── recent orders ── */}
                    <section style={{ marginBottom: 52 }}>
                        <div className="row-between" style={{ marginBottom: 22 }}>
                            <div>
                                <span className="eyebrow">Terakhir</span>
                                <h2 style={{ marginTop: 8, fontSize: 24 }}>Pesanan terbaru</h2>
                            </div>
                            {pesanan.length > 0 && (
                                <button className="btn btn-ghost btn-sm" onClick={() => navigate("/customer/pesanan-saya")}>
                                    Lihat semua
                                    <i className="bi bi-arrow-right" aria-hidden="true" />
                                </button>
                            )}
                        </div>

                        {loadingPesanan ? (
                            <div className="stack gap-16">
                                <SkeletonBox height={92} radius="var(--radius-xl)" />
                                <SkeletonBox height={92} radius="var(--radius-xl)" />
                            </div>
                        ) : terbaru.length === 0 ? (
                            <div className="card" style={{ textAlign: "center", padding: 40 }}>
                                <StickerInline name="leaf" size={40} />
                                <h4 style={{ margin: "14px 0 8px" }}>Belum ada pesanan</h4>
                                <p className="text-muted body-s" style={{ marginBottom: 20 }}>
                                    Pesanan pertamamu akan muncul di sini.
                                </p>
                                <button className="btn btn-primary btn-sm" onClick={() => navigate("/customer/produk")}>
                                    Mulai belanja
                                </button>
                            </div>
                        ) : (
                            <div className="stack gap-16">
                                {terbaru.map((item) => (
                                    <article className="order-card" key={item.id_pesanan}>
                                        <div>
                                            <div className="order-tags">
                                                <span className="badge badge-cocoa">#{item.id_pesanan}</span>
                                                <span className={`badge ${tone(item.status_pembayaran)}`}>
                                                    {item.status_pembayaran || "pending"}
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
                                                            ? new Date(item.created_at).toLocaleDateString("id-ID")
                                                            : "—"}
                                                    </strong>
                                                </span>
                                                <span>
                                                    Pembayaran: <strong>{item.metode_pembayaran || "—"}</strong>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="order-amount">
                                            <span className="value">Rp {formatRupiah(item.total_harga)}</span>
                                            <button
                                                className="btn btn-mint btn-sm"
                                                onClick={() => navigate(`/customer/pesanan/${item.id_pesanan}`)}
                                            >
                                                Detail
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* ── recommendations ── */}
                    <section>
                        <div className="row-between" style={{ marginBottom: 22 }}>
                            <div>
                                <span className="eyebrow">Untukmu</span>
                                <h2 style={{ marginTop: 8, fontSize: 24 }}>Mungkin kamu suka</h2>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={() => navigate("/customer/produk")}>
                                Semua produk
                                <i className="bi bi-arrow-right" aria-hidden="true" />
                            </button>
                        </div>

                        {loadingProduk ? (
                            <ProductSkeletonGrid count={4} />
                        ) : produk.length === 0 ? (
                            <div className="state-inline">Belum ada produk untuk ditampilkan.</div>
                        ) : (
                            <div className="product-grid">
                                {produk.slice(0, 4).map((item) => (
                                    <ProductCard
                                        key={item.id_produk}
                                        item={item}
                                        onAddToCart={handleAdd}
                                        onClick={() => navigate("/customer/produk")}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>

            <CustomerFooter />

            <div className="toast-container">
                <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />
            </div>
        </div>
    );
};

export default CustomerDashboardPage;
