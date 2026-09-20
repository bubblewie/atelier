import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { TableRowSkeleton } from "../components/ui/Skeleton";
import ConfirmModal from "../components/common/ConfirmModal";
import Toast from "../components/ui/Toast";
import "./AdminPages.css";

function KategoriListPage() {
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [target, setTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [toast, setToast] = useState({ message: "", type: "success" });

    const showToast = useCallback((message, type = "success") => {
        setToast({ message, type });
        window.setTimeout(() => setToast({ message: "", type }), 3400);
    }, []);

    const getCategories = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const response = await api.get("/kategori");
            setCategories(response.data?.data || []);
        } catch (err) {
            console.error("Gagal mengambil kategori:", err);
            setError("Daftar kategori belum bisa dimuat.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        getCategories();
    }, [getCategories]);

    const hasil = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return categories;
        return categories.filter((item) =>
            String(item.nama_kategori || "").toLowerCase().includes(keyword)
        );
    }, [categories, search]);

    const handleDelete = async () => {
        if (!target) return;
        try {
            setDeleting(true);
            await api.delete(`/kategori/${target.id_kategori}`);
            showToast("Kategori berhasil dihapus.", "success");
            setTarget(null);
            await getCategories();
        } catch (err) {
            console.error("Gagal menghapus kategori:", err);
            showToast(
                err.response?.data?.message ||
                    "Kategori gagal dihapus. Pastikan tidak ada produk yang masih memakainya.",
                "error"
            );
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            <header className="admin-head">
                <div>
                    <span className="eyebrow">Katalog</span>
                    <h1>Kategori</h1>
                    <p>Kelompokkan produk agar mudah ditemukan pembeli.</p>
                </div>

                <div className="admin-head-actions">
                    <button className="btn btn-outline btn-sm" onClick={getCategories} disabled={loading}>
                        {loading ? <span className="spin" /> : <i className="bi bi-arrow-clockwise" aria-hidden="true" />}
                        Muat ulang
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate("/kategori/create")}>
                        <i className="bi bi-plus-lg" aria-hidden="true" />
                        Tambah kategori
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
                        placeholder="Cari nama kategori…"
                        aria-label="Cari kategori"
                    />
                </div>
                <span className="body-s text-muted">{hasil.length} kategori</span>
            </div>

            <section className="panel">
                <div className="table-wrap">
                    <table className="a-table" style={{ minWidth: 480 }}>
                        <thead>
                            <tr>
                                <th style={{ width: 100 }}>ID</th>
                                <th>Nama kategori</th>
                                <th style={{ width: 170 }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <>
                                    <TableRowSkeleton columns={3} />
                                    <TableRowSkeleton columns={3} />
                                    <TableRowSkeleton columns={3} />
                                </>
                            ) : error ? (
                                <tr>
                                    <td colSpan="3">
                                        <div className="state-inline">
                                            {error}
                                            <div style={{ marginTop: 14 }}>
                                                <button className="btn btn-primary btn-sm" onClick={getCategories}>
                                                    Coba lagi
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : hasil.length === 0 ? (
                                <tr>
                                    <td colSpan="3">
                                        <div className="state-inline">
                                            {categories.length === 0
                                                ? "Belum ada kategori."
                                                : "Tidak ada kategori yang cocok."}
                                            <div style={{ marginTop: 14 }}>
                                                {categories.length === 0 ? (
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => navigate("/kategori/create")}
                                                    >
                                                        Tambah kategori pertama
                                                    </button>
                                                ) : (
                                                    <button className="btn btn-outline btn-sm" onClick={() => setSearch("")}>
                                                        Hapus pencarian
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                hasil.map((item) => (
                                    <tr key={item.id_kategori}>
                                        <td className="cell-strong">#{item.id_kategori}</td>
                                        <td className="cell-strong">{item.nama_kategori}</td>
                                        <td>
                                            <div className="cell-actions">
                                                <button
                                                    className="btn btn-mint btn-xs"
                                                    onClick={() => navigate(`/kategori/edit/${item.id_kategori}`)}
                                                >
                                                    Ubah
                                                </button>
                                                <button className="btn btn-danger btn-xs" onClick={() => setTarget(item)}>
                                                    Hapus
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <ConfirmModal
                open={Boolean(target)}
                title="Hapus kategori ini?"
                description={
                    target
                        ? `"${target.nama_kategori}" akan dihapus. Produk yang masih memakainya bisa terpengaruh.`
                        : undefined
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
}

export default KategoriListPage;
