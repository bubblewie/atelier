import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { TableRowSkeleton } from "../../components/ui/Skeleton";
import ConfirmModal from "../../components/common/ConfirmModal";
import Toast from "../../components/ui/Toast";
import { productImage, formatRupiah, handleImageError } from "../../components/common/media";
import "../AdminPages.css";


const ProdukListPage = () => {
    const navigate = useNavigate();

    const [produk, setProduk] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [kategoriFilter, setKategoriFilter] = useState("Semua");
    const [target, setTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [toast, setToast] = useState({ message: "", type: "success" });

    const showToast = useCallback((message, type = "success") => {
        setToast({ message, type });
        window.setTimeout(() => setToast({ message: "", type }), 3400);
    }, []);

    const fetchProduk = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const response = await api.get(`/produk`);
            setProduk(response.data?.data || []);
        } catch (err) {
            console.error("Gagal mengambil produk:", err);
            setError("Daftar produk belum bisa dimuat.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProduk();
    }, [fetchProduk]);

    const daftarKategori = useMemo(
        () => ["Semua", ...new Set(produk.map((p) => p.kategori?.nama_kategori).filter(Boolean))],
        [produk]
    );

    const hasil = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        return produk.filter((item) => {
            const nama = String(item.nama_produk || "").toLowerCase();
            const kat = String(item.kategori?.nama_kategori || "").toLowerCase();
            const cocokCari = !keyword || nama.includes(keyword) || kat.includes(keyword);
            const cocokKat = kategoriFilter === "Semua" || item.kategori?.nama_kategori === kategoriFilter;
            return cocokCari && cocokKat;
        });
    }, [produk, search, kategoriFilter]);

    const handleDelete = async () => {
        if (!target) return;
        try {
            setDeleting(true);
            await api.delete(`/produk/${target.id_produk}`);
            showToast("Produk berhasil dihapus.", "success");
            setTarget(null);
            await fetchProduk();
        } catch (err) {
            console.error("Gagal menghapus produk:", err);
            showToast(err.response?.data?.message || "Produk gagal dihapus.", "error");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            <header className="admin-head">
                <div>
                    <span className="eyebrow">Katalog</span>
                    <h1>Produk</h1>
                    <p>Kelola item katalog, harga, dan stok.</p>
                </div>

                <div className="admin-head-actions">
                    <button className="btn btn-outline btn-sm" onClick={fetchProduk} disabled={loading}>
                        {loading ? <span className="spin" /> : <i className="bi bi-arrow-clockwise" aria-hidden="true" />}
                        Muat ulang
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate("/produk/tambah")}>
                        <i className="bi bi-plus-lg" aria-hidden="true" />
                        Tambah produk
                    </button>
                </div>
            </header>

            <div className="admin-toolbar">
                <div className="admin-search">
                    <i className="bi bi-search" aria-hidden="true" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari nama produk atau kategori…"
                        aria-label="Cari produk"
                    />
                </div>

                <div style={{ minWidth: 180 }}>
                    <label htmlFor="filter-kategori" className="form-label" style={{ position: "absolute", left: -9999 }}>
                        Filter kategori
                    </label>
                    <select
                        id="filter-kategori"
                        className="form-select form-select-sm"
                        value={kategoriFilter}
                        onChange={(e) => setKategoriFilter(e.target.value)}
                    >
                        {daftarKategori.map((k) => (
                            <option key={k} value={k}>
                                {k === "Semua" ? "Semua kategori" : k}
                            </option>
                        ))}
                    </select>
                </div>

                <span className="body-s text-muted">{hasil.length} item</span>
            </div>

            <section className="panel">
                <div className="table-wrap">
                    <table className="a-table">
                        <thead>
                            <tr>
                                <th style={{ width: 76 }}>Foto</th>
                                <th>Nama produk</th>
                                <th>Kategori</th>
                                <th>Harga</th>
                                <th>Stok</th>
                                <th style={{ width: 170 }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <>
                                    <TableRowSkeleton columns={6} />
                                    <TableRowSkeleton columns={6} />
                                    <TableRowSkeleton columns={6} />
                                </>
                            ) : error ? (
                                <tr>
                                    <td colSpan="6">
                                        <div className="state-inline">
                                            {error}
                                            <div style={{ marginTop: 14 }}>
                                                <button className="btn btn-primary btn-sm" onClick={fetchProduk}>
                                                    Coba lagi
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : hasil.length === 0 ? (
                                <tr>
                                    <td colSpan="6">
                                        <div className="state-inline">
                                            {produk.length === 0
                                                ? "Belum ada produk di katalog."
                                                : "Tidak ada produk yang cocok dengan filter."}
                                            <div style={{ marginTop: 14 }}>
                                                {produk.length === 0 ? (
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => navigate("/produk/tambah")}
                                                    >
                                                        Tambah produk pertama
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn btn-outline btn-sm"
                                                        onClick={() => {
                                                            setSearch("");
                                                            setKategoriFilter("Semua");
                                                        }}
                                                    >
                                                        Atur ulang filter
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                hasil.map((item) => {
                                    const stok = Number(item.stok || 0);
                                    return (
                                        <tr key={item.id_produk}>
                                            <td>
                                                <img
                                                    src={productImage(item, { width: 120, height: 120 })}
                                            onError={handleImageError(item)}
                                                    alt={item.nama_produk}
                                                    style={{
                                                        width: 48,
                                                        height: 48,
                                                        objectFit: "cover",
                                                        borderRadius: "var(--radius-sm)",
                                                        background: "var(--mint-50)",
                                                    }}
                                                    loading="lazy"
                                                />
                                            </td>
                                            <td>
                                                <div className="cell-strong">{item.nama_produk}</div>
                                                <div className="caption">ID #{item.id_produk}</div>
                                            </td>
                                            <td>
                                                <span className="badge badge-mint">
                                                    {item.kategori?.nama_kategori || "Tanpa kategori"}
                                                </span>
                                            </td>
                                            <td className="cell-strong">Rp {formatRupiah(item.harga)}</td>
                                            <td>
                                                <span
                                                    className={`badge ${
                                                        stok <= 0 ? "badge-error" : stok <= 5 ? "badge-warning" : "badge-success"
                                                    }`}
                                                >
                                                    {stok} pcs
                                                </span>
                                            </td>
                                            <td>
                                                <div className="cell-actions">
                                                    <button
                                                        className="btn btn-mint btn-xs"
                                                        onClick={() => navigate(`/produk/edit/${item.id_produk}`)}
                                                    >
                                                        Ubah
                                                    </button>
                                                    <button className="btn btn-danger btn-xs" onClick={() => setTarget(item)}>
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <ConfirmModal
                open={Boolean(target)}
                title="Hapus produk ini?"
                description={
                    target ? `"${target.nama_produk}" akan dihapus permanen dari katalog.` : undefined
                }
                confirmLabel="Ya, hapus"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setTarget(null)}
            />

            <div className="toast-container">
                <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />
            </div>
        </div>
    );
};

export default ProdukListPage;
