import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { TableRowSkeleton } from "../components/ui/Skeleton";
import Toast from "../components/ui/Toast";
import { formatRupiah } from "../components/common/media";
import "./AdminPages.css";


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

const RiwayatPesananPage = () => {
    const navigate = useNavigate();

    const [pesanan, setPesanan] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [toast, setToast] = useState({ message: "", type: "error" });

    const showToast = useCallback((message, type = "error") => {
        setToast({ message, type });
        window.setTimeout(() => setToast({ message: "", type }), 3400);
    }, []);

    const fetchPesanan = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const response = await api.get(`/pesanan`);
            setPesanan(response.data?.data || []);
        } catch (err) {
            console.error("Gagal mengambil riwayat pesanan:", err);
            setError("Riwayat pesanan belum bisa dimuat.");
            showToast("Riwayat pesanan gagal dimuat.", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchPesanan();
    }, [fetchPesanan]);

    const hasil = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        return pesanan
            .filter((item) => {
                if (!keyword) return true;
                const nama = String(item.user?.nama || item.user?.name || "").toLowerCase();
                const kode = String(item.kode_transaksi || "").toLowerCase();
                return nama.includes(keyword) || kode.includes(keyword) || String(item.id_pesanan).includes(keyword);
            })
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }, [pesanan, search]);

    const totalNilai = useMemo(
        () => hasil.reduce((sum, p) => sum + Number(p.total_harga || 0), 0),
        [hasil]
    );

    return (
        <div>
            <header className="admin-head">
                <div>
                    <span className="eyebrow">Penjualan</span>
                    <h1>Riwayat pesanan</h1>
                    <p>Catatan lengkap seluruh transaksi pelanggan.</p>
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
                        placeholder="Cari ID, pelanggan, atau kode transaksi…"
                        aria-label="Cari riwayat pesanan"
                    />
                </div>
                <span className="body-s text-muted">
                    {hasil.length} transaksi · Rp {formatRupiah(totalNilai)}
                </span>
            </div>

            <section className="panel">
                <div className="table-wrap">
                    <table className="a-table" style={{ minWidth: 900 }}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Kode transaksi</th>
                                <th>Tanggal</th>
                                <th>Pelanggan</th>
                                <th>Total</th>
                                <th>Pembayaran</th>
                                <th>Pengiriman</th>
                                <th style={{ width: 110 }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <>
                                    <TableRowSkeleton columns={8} />
                                    <TableRowSkeleton columns={8} />
                                    <TableRowSkeleton columns={8} />
                                </>
                            ) : error ? (
                                <tr>
                                    <td colSpan="8">
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
                                    <td colSpan="8">
                                        <div className="state-inline">
                                            {pesanan.length === 0
                                                ? "Belum ada transaksi tercatat."
                                                : "Tidak ada transaksi yang cocok dengan pencarian."}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                hasil.map((item) => (
                                    <tr key={item.id_pesanan}>
                                        <td className="cell-strong">#{item.id_pesanan}</td>
                                        <td style={{ fontSize: 13 }}>{item.kode_transaksi || "—"}</td>
                                        <td style={{ whiteSpace: "nowrap", fontSize: 13 }}>
                                            {item.created_at ? new Date(item.created_at).toLocaleDateString("id-ID") : "—"}
                                        </td>
                                        <td>{item.user?.nama || item.user?.name || `User #${item.id_user}`}</td>
                                        <td className="cell-strong">Rp {formatRupiah(item.total_harga)}</td>
                                        <td>
                                            <span className={`badge ${tone(item.status_pembayaran)}`}>
                                                {item.status_pembayaran || "pending"}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${tone(item.status_pengiriman)}`}>
                                                {item.status_pengiriman || "dikemas"}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-mint btn-xs"
                                                onClick={() => navigate(`/pesanan/detail/${item.id_pesanan}`)}
                                            >
                                                Detail
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <div className="toast-container">
                <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "error" })} />
            </div>
        </div>
    );
};

export default RiwayatPesananPage;
