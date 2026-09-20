import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import CustomerNavbar from "../../components/CustomerNavbar";
import CustomerFooter from "../../components/CustomerFooter";
import ProductCard from "../../components/common/ProductCard";
import EmptyState from "../../components/common/EmptyState";
import Sticker from "../../components/common/Sticker";
import { ProductSkeletonGrid } from "../../components/ui/Skeleton";
import Toast from "../../components/ui/Toast";
import { productImage, formatRupiah, handleImageError } from "../../components/common/media";
import { addToCart } from "../../lib/store";
import "../CustomerPages.css";


const SORTS = [
    { id: "baru", label: "Terbaru" },
    { id: "murah", label: "Harga terendah" },
    { id: "mahal", label: "Harga tertinggi" },
    { id: "nama", label: "Nama A–Z" },
];

const ProdukCustomerPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [produk, setProduk] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [search, setSearch] = useState(location.state?.search || "");
    const [kategori, setKategori] = useState(location.state?.kategori || "Semua");
    const [sort, setSort] = useState("baru");
    const [toast, setToast] = useState({ message: "", type: "success" });

    const showToast = useCallback((message, type = "success") => {
        setToast({ message, type });
        window.setTimeout(() => setToast({ message: "", type }), 3200);
    }, []);

    const fetchProduk = useCallback(async () => {
        try {
            setLoading(true);
            setLoadError("");
            const response = await api.get(`/produk`);
            setProduk(response.data?.data || []);
        } catch (error) {
            console.error("Gagal mengambil produk:", error);
            setProduk([]);
            setLoadError("Katalog belum bisa dimuat. Periksa koneksi ke server lalu coba lagi.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProduk();
    }, [fetchProduk]);

    /* Keep the page in sync when the navbar pushes a new search / category. */
    useEffect(() => {
        if (location.state?.search !== undefined) setSearch(location.state.search || "");
        if (location.state?.kategori !== undefined) setKategori(location.state.kategori || "Semua");
    }, [location.state]);

    const daftarKategori = useMemo(
        () => ["Semua", ...new Set(produk.map((p) => p.kategori?.nama_kategori).filter(Boolean))],
        [produk]
    );

    const hasil = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        const filtered = produk.filter((item) => {
            const nama = String(item.nama_produk || "").toLowerCase();
            const kat = String(item.kategori?.nama_kategori || "").toLowerCase();
            const cocokCari = !keyword || nama.includes(keyword) || kat.includes(keyword);
            const cocokKat = kategori === "Semua" || item.kategori?.nama_kategori === kategori;
            return cocokCari && cocokKat;
        });

        const sorted = [...filtered];
        if (sort === "murah") sorted.sort((a, b) => Number(a.harga || 0) - Number(b.harga || 0));
        else if (sort === "mahal") sorted.sort((a, b) => Number(b.harga || 0) - Number(a.harga || 0));
        else if (sort === "nama")
            sorted.sort((a, b) => String(a.nama_produk || "").localeCompare(String(b.nama_produk || "")));
        else sorted.sort((a, b) => Number(b.id_produk || 0) - Number(a.id_produk || 0));

        return sorted;
    }, [produk, search, kategori, sort]);

    const handleAdd = (item) => {
        const result = addToCart(item);
        if (!result.ok) {
            showToast(
                result.stok > 0 ? `Stok ${item.nama_produk} tinggal ${result.stok}` : `${item.nama_produk} sedang habis`,
                "warning"
            );
            return;
        }
        showToast(`${item.nama_produk} masuk keranjang`, "success");
    };

    const resetFilters = () => {
        setSearch("");
        setKategori("Semua");
        setSort("baru");
    };


    return (
        <div className="customer-page-wrapper">
            <CustomerNavbar />

            <main className="page-main">
                <div className="atelier-container">
                    <header className="page-head center">
                        <Sticker name="sparkle" size={34} rotate={-14} float style={{ top: 34, left: "12%" }} />
                        <Sticker name="leaf" size={38} rotate={16} float style={{ top: 46, right: "12%" }} />
                        <span className="eyebrow">Katalog</span>
                        <h1>Semua yang ada di studio</h1>
                        <p>Alat tulis, jurnal, dan perlengkapan kecil — dipilih supaya awet dipakai.</p>
                    </header>

                    {/* toolbar */}
                    <div className="catalog-toolbar">
                        <div className="catalog-search">
                            <i className="bi bi-search" aria-hidden="true" />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari produk atau kategori…"
                                aria-label="Cari produk"
                            />
                        </div>

                        <div className="catalog-filters">
                            {daftarKategori.map((k) => (
                                <button
                                    key={k}
                                    type="button"
                                    className={`filter-pill ${kategori === k ? "active" : ""}`}
                                    onClick={() => setKategori(k)}
                                >
                                    {k}
                                </button>
                            ))}
                        </div>

                        <div style={{ minWidth: 168 }}>
                            <label htmlFor="sort-select" className="form-label" style={{ position: "absolute", left: -9999 }}>
                                Urutkan
                            </label>
                            <select
                                id="sort-select"
                                className="form-select form-select-sm"
                                value={sort}
                                onChange={(e) => setSort(e.target.value)}
                            >
                                {SORTS.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* results */}
                    {loading ? (
                        <ProductSkeletonGrid count={8} />
                    ) : loadError ? (
                        <EmptyState
                            tone="error"
                            title="Katalog belum termuat"
                            description={loadError}
                            action={
                                <button className="btn btn-primary" onClick={fetchProduk}>
                                    Coba lagi
                                </button>
                            }
                        />
                    ) : hasil.length === 0 ? (
                        <EmptyState
                            title="Tidak ada produk yang cocok"
                            description="Coba ubah kata kunci atau pilih kategori lain."
                            action={
                                <button className="btn btn-primary" onClick={resetFilters}>
                                    Atur ulang filter
                                </button>
                            }
                        />
                    ) : (
                        <>
                            <p className="catalog-count">
                                Menampilkan <strong>{hasil.length}</strong> produk
                                {kategori !== "Semua" && ` di kategori ${kategori}`}
                            </p>

                            <div className="product-grid">
                                {hasil.map((item) => (
                                    <ProductCard
                                        key={item.id_produk}
                                        item={item}
                                        onAddToCart={handleAdd}
                                        onClick={() => navigate(`/produk/${item.id_produk}`)}
                                    />
                                ))}
                            </div>
                        </>
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

export default ProdukCustomerPage;
