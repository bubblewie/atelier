import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { TableRowSkeleton } from "../../components/ui/Skeleton";
import Toast from "../../components/ui/Toast";
import { formatRupiah } from "../../components/common/media";
import "../AdminPages.css";


const BAYAR = ["pending", "lunas", "gagal"];
const KIRIM = ["dikemas", "dikirim", "selesai", "dibatalkan"];

const FILTERS = [
    { id: "semua", label: "Semua" },
    { id: "pending", label: "Belum lunas" },
    { id: "dikemas", label: "Dikemas" },
    { id: "dikirim", label: "Dikirim" },
    { id: "selesai", label: "Selesai" },
];

const PesananListPage = () => {
    const navigate = useNavigate();

    const [pesanan, setPesanan] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("semua");
    const [savingId, setSavingId] = useState(null);
    const [dirty, setDirty] = useState({});
    const [toast, setToast] = useState({ message: "", type: "success" });

    const showToast = useCallback((message, type = "success") => {
        setToast({ message, type });
        window.setTimeout(() => setToast({ message: "", type }), 3400);
    }, []);

    const fetchPesanan = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const response = await api.get(`/pesanan`);
            setPesanan(response.data?.data || []);
            setDirty({});
        } catch (err) {
            console.error("Gagal mengambil pesanan:", err);
            setError("Daftar pesanan belum bisa dimuat.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPesanan();
    }, [fetchPesanan]);

    const hasil = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return pesanan
            .filter((item) => {
                const nama = String(item.user?.nama || item.user?.name || "").toLowerCase();
                const kode = String(item.kode_transaksi || "").toLowerCase();
                const id = String(item.id_pesanan || "");
                const cocokCari = !keyword || nama.includes(keyword) || kode.includes(keyword) || id.includes(keyword);

                if (!cocokCari) return false;
                if (filter === "semua") return true;
                if (filter === "pending")
                    return String(item.status_pembayaran || "").toLowerCase() !== "lunas";
                return String(item.status_pengiriman || "").toLowerCase() === filter;
            })
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }, [pesanan, search, filter]);

    /* Edits stay local until saved, so the operator can review before committing. */
    const handleStatusChange = (id, field, value) => {
        setPesanan((prev) =>
            prev.map((item) => (item.id_pesanan === id ? { ...item, [field]: value } : item))
        );
        setDirty((prev) => ({ ...prev, [id]: true }));
    };

    const handleSave = async (item) => {
        try {
            setSavingId(item.id_pesanan);

            // Same endpoint and payload shape as before.
            await api.put(`/pesanan/${item.id_pesanan}/status`, {
                status_pembayaran: item.status_pembayaran,
                status_pengiriman: item.status_pengiriman,
            });

            showToast(`Status pesanan #${item.id_pesanan} diperbarui.`, "success");
            setDirty((prev) => {
                const next = { ...prev };
                delete next[item.id_pesanan];
                return next;
            });
            await fetchPesanan();
        } catch (err) {
            console.error("Gagal update status:", err);
            showToast(err.response?.data?.message || "Status gagal diperbarui.", "error");
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div>
            <header className="admin-head">
                <div>
                    <span className="eyebrow">Penjualan</span>
                    <h1>Pesanan</h1>
                    <p>Perbarui status pembayaran dan pengiriman pelanggan.</p>
                </div>

                <div className="admin-head-actions">
                    <button className="btn btn-outline btn-sm" onClick={fetchPesanan} disabled={loading}>
                        {loading ? <span className="spin" /> : <i className="bi bi-arrow-clockwise" aria-hidden="true" />}
                        Muat ulang
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
                        placeholder="Cari ID, nama pelanggan, atau kode transaksi…"
                        aria-label="Cari pesanan"
                    />
                </div>

                <div className="catalog-filters">
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
            </div>

            <section className="panel">
                <div className="table-wrap">
                    <table className="a-table" style={{ minWidth: 940 }}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tanggal</th>
                                <th>Pelanggan</th>
                                <th>Total</th>
                                <th style={{ width: 150 }}>Pembayaran</th>
                                <th style={{ width: 160 }}>Pengiriman</th>
                                <th style={{ width: 160 }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <>
                                    <TableRowSkeleton columns={7} />
                                    <TableRowSkeleton columns={7} />
                                    <TableRowSkeleton columns={7} />
                                </>
                            ) : error ? (
                                <tr>
                                    <td colSpan="7">
                                        <div className="state-inline">
                                            {error}
                                            <div style={{ marginTop: 14 }}>
                                                <button className="btn btn-primary btn-sm" onClick={fetchPesanan}>
                                                    Coba lagi
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : hasil.length === 0 ? (
                                <tr>
                                    <td colSpan="7">
                                        <div className="state-inline">
                                            {pesanan.length === 0
                                                ? "Belum ada pesanan yang masuk."
                                                : "Tidak ada pesanan yang cocok dengan filter."}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                hasil.map((item) => (
                                    <tr key={item.id_pesanan}>
                                        <td className="cell-strong">#{item.id_pesanan}</td>
                                        <td style={{ whiteSpace: "nowrap" }}>
                                            {item.created_at ? new Date(item.created_at).toLocaleDateString("id-ID") : "—"}
                                        </td>
                                        <td>
                                            <div className="cell-strong">
                                                {item.user?.nama || item.user?.name || `User #${item.id_user}`}
                                            </div>
                                            {item.kode_transaksi && <div className="caption">{item.kode_transaksi}</div>}
                                        </td>
                                        <td className="cell-strong">Rp {formatRupiah(item.total_harga)}</td>

                                        <td>
                                            <label
                                                htmlFor={`bayar-${item.id_pesanan}`}
                                                className="form-label"
                                                style={{ position: "absolute", left: -9999 }}
                                            >
                                                Status pembayaran pesanan {item.id_pesanan}
                                            </label>
                                            <select
                                                id={`bayar-${item.id_pesanan}`}
                                                className="form-select form-select-sm"
                                                value={item.status_pembayaran || "pending"}
                                                onChange={(e) =>
                                                    handleStatusChange(item.id_pesanan, "status_pembayaran", e.target.value)
                                                }
                                            >
                                                {BAYAR.map((s) => (
                                                    <option key={s} value={s}>
                                                        {s}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>

                                        <td>
                                            <label
                                                htmlFor={`kirim-${item.id_pesanan}`}
                                                className="form-label"
                                                style={{ position: "absolute", left: -9999 }}
                                            >
                                                Status pengiriman pesanan {item.id_pesanan}
                                            </label>
                                            <select
                                                id={`kirim-${item.id_pesanan}`}
                                                className="form-select form-select-sm"
                                                value={item.status_pengiriman || "dikemas"}
                                                onChange={(e) =>
                                                    handleStatusChange(item.id_pesanan, "status_pengiriman", e.target.value)
                                                }
                                            >
                                                {KIRIM.map((s) => (
                                                    <option key={s} value={s}>
                                                        {s}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>

                                        <td>
                                            <div className="cell-actions">
                                                <button
                                                    className={dirty[item.id_pesanan] ? "btn btn-primary btn-xs" : "btn btn-outline btn-xs"}
                                                    disabled={savingId === item.id_pesanan || !dirty[item.id_pesanan]}
                                                    onClick={() => handleSave(item)}
                                                >
                                                    {savingId === item.id_pesanan ? <span className="spin" /> : null}
                                                    Simpan
                                                </button>
                                                <button
                                                    className="btn btn-mint btn-xs"
                                                    onClick={() => navigate(`/pesanan/detail/${item.id_pesanan}`)}
                                                >
                                                    Detail
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

            <div className="toast-container">
                <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />
            </div>
        </div>
    );
};

export default PesananListPage;
