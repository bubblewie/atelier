import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import CustomerNavbar from "../../components/CustomerNavbar";
import CustomerFooter from "../../components/CustomerFooter";
import ProductCard from "../../components/common/ProductCard";
import EmptyState from "../../components/common/EmptyState";
import Toast from "../../components/ui/Toast";
import Sticker, { StickerInline } from "../../components/common/Sticker";
import { SkeletonBox } from "../../components/ui/Skeleton";
import { productImage, handleImageError, formatRupiah } from "../../components/common/media";
import { addToCart } from "../../lib/store";
import "../CustomerPages.css";

/**
 * Halaman detail produk publik.
 *
 * Sebelumnya katalog hanya punya quick-view modal, jadi produk tidak
 * punya URL sendiri — tidak bisa dibagikan, tidak bisa di-bookmark, dan
 * tombol back browser tidak berfungsi. Halaman ini menutup celah itu
 * dengan endpoint yang SUDAH ADA: `GET /produk/{id}` (publik).
 */
const ProdukDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [produk, setProduk] = useState(null);
    const [semua, setSemua] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [qty, setQty] = useState(1);
    const [toast, setToast] = useState({ message: "", type: "success" });

    const showToast = useCallback((message, type = "success") => {
        setToast({ message, type });
        window.setTimeout(() => setToast({ message: "", type }), 3200);
    }, []);

    const fetchProduk = useCallback(async () => {
        try {
            setLoading(true);
            setLoadError("");
            setQty(1);

            const [detailRes, listRes] = await Promise.allSettled([
                api.get(`/produk/${id}`),
                api.get(`/produk`),
            ]);

            if (detailRes.status === "rejected") throw detailRes.reason;

            setProduk(detailRes.value?.data?.data || null);
            setSemua(listRes.status === "fulfilled" ? listRes.value?.data?.data || [] : []);
        } catch (error) {
            console.error("Gagal mengambil detail produk:", error);
            setProduk(null);
            setLoadError(
                error.response?.status === 404
                    ? "Produk ini tidak ditemukan. Mungkin sudah dihapus dari katalog."
                    : "Detail produk belum bisa dimuat. Periksa koneksi ke server."
            );
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchProduk();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [fetchProduk]);

    const stok = Number(produk?.stok ?? 0);
    const habis = stok <= 0;

    const serupa = useMemo(() => {
        if (!produk) return [];
        return semua
            .filter(
                (p) =>
                    Number(p.id_produk) !== Number(produk.id_produk) &&
                    p.kategori?.nama_kategori === produk.kategori?.nama_kategori
            )
            .slice(0, 4);
    }, [semua, produk]);

    const tambah = () => {
        if (habis) return;

        // addToCart menambah satu unit per panggilan dan sudah memvalidasi
        // stok di dalamnya, jadi qty > 1 cukup dipanggil berulang.
        let gagal = null;
        for (let i = 0; i < qty; i += 1) {
            const hasil = addToCart(produk);
            if (!hasil.ok) {
                gagal = hasil;
                break;
            }
        }

        if (gagal) {
            showToast(
                gagal.stok > 0 ? `Stok tersisa ${gagal.stok}` : `${produk.nama_produk} sedang habis`,
                "warning"
            );
            return;
        }

        showToast(`${qty} × ${produk.nama_produk} masuk keranjang`, "success");
    };

    /* -------------------------------------------------------- render */
    if (loading) {
        return (
            <div className="customer-page-wrapper">
                <CustomerNavbar />
                <main className="page-main">
                    <div className="atelier-container" style={{ paddingTop: 40 }}>
                        <div className="detail-layout">
                            <SkeletonBox height={460} radius="var(--radius-hero)" />
                            <div>
                                <SkeletonBox width="40%" height={14} />
                                <div style={{ height: 14 }} />
                                <SkeletonBox width="80%" height={34} />
                                <div style={{ height: 18 }} />
                                <SkeletonBox width="50%" height={28} />
                            </div>
                        </div>
                    </div>
                </main>
                <CustomerFooter />
            </div>
        );
    }

    if (loadError || !produk) {
        return (
            <div className="customer-page-wrapper">
                <CustomerNavbar />
                <main className="page-main">
                    <div className="atelier-container">
                        <EmptyState
                            tone="error"
                            title="Produk tidak ditemukan"
                            description={loadError}
                            action={
                                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                                    <button className="btn btn-primary" onClick={fetchProduk}>
                                        Coba lagi
                                    </button>
                                    <button className="btn btn-outline" onClick={() => navigate("/customer/produk")}>
                                        Lihat katalog
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
                    <button className="back-link" onClick={() => navigate("/customer/produk")}>
                        <i className="bi bi-arrow-left" aria-hidden="true" /> Semua produk
                    </button>

                    <div className="detail-layout">
                        {/* ── Visual ── */}
                        <div className="detail-media">
                            <Sticker name="sparkle" size={34} rotate={-12} float style={{ top: -14, left: -12 }} />
                            <Sticker name="star" size={30} rotate={10} style={{ bottom: -10, right: -8 }} />

                            <figure className="frame-photo detail-photo">
                                <img
                                    src={productImage(produk, { width: 900, height: 900 })}
                                    onError={handleImageError(produk)}
                                    alt={produk.nama_produk}
                                />
                            </figure>
                        </div>

                        {/* ── Informasi ── */}
                        <div className="detail-info">
                            <span className="eyebrow">{produk.kategori?.nama_kategori || "Atelier"}</span>
                            <h1 style={{ margin: "10px 0 12px" }}>{produk.nama_produk}</h1>

                            <div className="detail-price">Rp {formatRupiah(produk.harga)}</div>

                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "16px 0 22px" }}>
                                <span
                                    className={`badge ${stok > 5 ? "badge-success" : stok > 0 ? "badge-warning" : "badge-error"}`}
                                >
                                    {habis ? "Stok habis" : `Stok ${stok}`}
                                </span>
                                <span className="badge badge-mint">Dikemas dengan tangan</span>
                            </div>

                            <p className="detail-desc">
                                {produk.deskripsi ||
                                    "Produk pilihan Atelier — dipilih untuk kualitas bahan dan kenyamanan pakai sehari-hari."}
                            </p>

                            {!habis && (
                                <div className="detail-qty">
                                    <span className="form-label" style={{ marginBottom: 0 }}>
                                        Jumlah
                                    </span>
                                    <div className="qty-ctrl">
                                        <button
                                            type="button"
                                            onClick={() => setQty((q) => Math.max(1, q - 1))}
                                            aria-label="Kurangi jumlah"
                                        >
                                            <i className="bi bi-dash" aria-hidden="true" />
                                        </button>
                                        <span>{qty}</span>
                                        <button
                                            type="button"
                                            onClick={() => setQty((q) => Math.min(stok, q + 1))}
                                            aria-label="Tambah jumlah"
                                        >
                                            <i className="bi bi-plus" aria-hidden="true" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
                                <button
                                    type="button"
                                    className="btn btn-primary btn-lg"
                                    style={{ flex: "1 1 220px" }}
                                    onClick={tambah}
                                    disabled={habis}
                                >
                                    <i className="bi bi-bag-plus" aria-hidden="true" />
                                    {habis ? "Stok habis" : "Tambah ke keranjang"}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline btn-lg"
                                    onClick={() => navigate("/keranjang")}
                                >
                                    Keranjang
                                </button>
                            </div>

                            <div className="note-card" style={{ marginTop: 26 }}>
                                <StickerInline name="leaf" size={18} /> Dikemas ulang dengan kertas daur ulang,
                                lengkap dengan kartu ucapan kecil di setiap pesanan.
                            </div>
                        </div>
                    </div>

                    {/* ── Produk serupa ── */}
                    {serupa.length > 0 && (
                        <section className="section-sm">
                            <div className="section-head">
                                <span className="eyebrow">Mungkin cocok juga</span>
                                <h2 style={{ marginTop: 8 }}>Dari kategori yang sama</h2>
                            </div>

                            <div className="product-grid">
                                {serupa.map((item) => (
                                    <ProductCard
                                        key={item.id_produk}
                                        item={item}
                                        onAddToCart={(p) => {
                                            const hasil = addToCart(p);
                                            showToast(
                                                hasil.ok
                                                    ? `${p.nama_produk} masuk keranjang`
                                                    : `${p.nama_produk} sedang habis`,
                                                hasil.ok ? "success" : "warning"
                                            );
                                        }}
                                        onClick={() => navigate(`/produk/${item.id_produk}`)}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
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

export default ProdukDetailPage;
