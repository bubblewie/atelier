import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import EmptyState from "../../components/common/EmptyState";
import BuktiPembayaranModal from "../../components/common/BuktiPembayaranModal";
import Toast from "../../components/ui/Toast";
import { TableRowSkeleton } from "../../components/ui/Skeleton";
import { StickerInline } from "../../components/common/Sticker";
import { formatRupiah } from "../../components/common/media";
import { methodLabel, paymentStatus } from "../../config/payment";
import "../AdminPages.css";


const FILTERS = [
    { id: "semua", label: "Semua" },
    { id: "pending", label: "Belum Dibayar" },
    { id: "menunggu_verifikasi", label: "Menunggu Verifikasi" },
    { id: "lunas", label: "Sudah Dibayar" },
    { id: "gagal", label: "Ditolak / Gagal" },
];

/**
 * Admin → Payments.
 *
 * Seluruh data berasal dari `GET /pesanan` yang sudah ada. Verifikasi dan
 * penolakan memakai `PUT /pesanan/{id}/status` — endpoint existing, tanpa
 * perubahan backend. Tidak ada statistik atau status yang dikarang: angka
 * ringkasan dihitung dari pesanan yang benar-benar dikembalikan API.
 */
const PembayaranListPage = () => {

    const [pesanan, setPesanan] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [filter, setFilter] = useState("semua");
    const [search, setSearch] = useState("");
    const [review, setReview] = useState(null); // pesanan yang sedang diperiksa
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState({ message: "", type: "success" });

    const showToast = useCallback((message, type = "success") => {
        setToast({ message, type });
        window.setTimeout(() => setToast({ message: "", type }), 3400);
    }, []);

    const fetchPesanan = useCallback(async () => {
        try {
            setLoading(true);
            setLoadError("");
            const response = await api.get(`/pesanan`);
            setPesanan(response.data?.data || []);
        } catch (error) {
            console.error("Gagal mengambil data pembayaran:", error);
            setPesanan([]);
            setLoadError("Data pembayaran belum bisa dimuat. Periksa koneksi ke server.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPesanan();
    }, [fetchPesanan]);

    /* Ringkasan dihitung dari data nyata, bukan angka statis. */
    const summary = useMemo(() => {
        const base = { total: pesanan.length, pending: 0, menunggu_verifikasi: 0, lunas: 0, gagal: 0, nilaiLunas: 0 };
        pesanan.forEach((p) => {
            const s = String(p.status_pembayaran || "pending").toLowerCase();
            if (s in base) base[s] += 1;
            if (s === "lunas") base.nilaiLunas += Number(p.total_harga || 0);
        });
        return base;
    }, [pesanan]);

    const hasil = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        return pesanan.filter((p) => {
            const status = String(p.status_pembayaran || "pending").toLowerCase();
            const cocokFilter = filter === "semua" || status === filter;
            if (!keyword) return cocokFilter;

            const haystack = [
                p.id_pesanan,
                p.kode_transaksi,
                p.user?.nama,
                p.user?.name,
                p.user?.email,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return cocokFilter && haystack.includes(keyword);
        });
    }, [pesanan, filter, search]);

    /**
     * Verifikasi / tolak pembayaran.
     * Backend hanya mengenal pending | lunas | gagal, jadi hanya itu yang dikirim.
     */
    /**
     * Verifikasi / tolak pembayaran lewat `PUT /pesanan/{id}/status`.
     * Backend menerima pending | menunggu_verifikasi | lunas | gagal,
     * dan mewajibkan alasan saat status di-set ke `gagal`.
     */
    const ubahStatus = async (statusBaru, alasanPenolakan) => {
        if (!review) return;

        try {
            setSaving(true);

            const payload = { status_pembayaran: statusBaru };
            if (statusBaru === "gagal") payload.alasan_penolakan = alasanPenolakan;

            await api.put(`/pesanan/${review.id_pesanan}/status`, payload);

            showToast(
                statusBaru === "lunas"
                    ? `Pembayaran pesanan #${review.id_pesanan} diverifikasi`
                    : `Pembayaran pesanan #${review.id_pesanan} ditolak`,
                statusBaru === "lunas" ? "success" : "info"
            );

            setReview(null);
            await fetchPesanan();
        } catch (error) {
            console.error("Gagal memperbarui pembayaran:", error);

            const errors = error.response?.data?.errors;
            showToast(
                errors
                    ? Object.values(errors).flat().join(" ")
                    : error.response?.data?.message ||
                          "Gagal memperbarui status pembayaran. Coba lagi.",
                "error"
            );
        } finally {
            setSaving(false);
        }
    };

    const stats = [
        { label: "Total Pesanan", value: summary.total, sticker: "leaf" },
        { label: "Belum Dibayar", value: summary.pending, sticker: "star" },
        { label: "Menunggu Verifikasi", value: summary.menunggu_verifikasi, sticker: "tape" },
        { label: "Sudah Dibayar", value: summary.lunas, sticker: "sparkle" },
        { label: "Ditolak / Gagal", value: summary.gagal, sticker: "heart" },
    ];

    return (
        <div>
            <header className="admin-head">
                <div>
                    <span className="eyebrow">Keuangan</span>
                    <h1>Pembayaran</h1>
                    <p>Periksa, verifikasi, dan tolak pembayaran pesanan pelanggan.</p>
                </div>
                <div className="admin-head-actions">
                    <button type="button" className="btn btn-outline btn-sm" onClick={fetchPesanan}>
                        <i className="bi bi-arrow-clockwise" aria-hidden="true" />
                        Muat ulang
                    </button>
                </div>
            </header>

            {/* ── Ringkasan ── */}
            <div className="admin-stats">
                {stats.map((s) => (
                    <div className="admin-stat" key={s.label}>
                        <span className="admin-stat-icon">
                            <StickerInline name={s.sticker} size={24} />
                        </span>
                        <span>
                            <span className="admin-stat-value">{loading ? "—" : s.value}</span>
                            <span className="admin-stat-label">{s.label}</span>
                        </span>
                    </div>
                ))}
            </div>

            <div className="note-card" style={{ marginBottom: 22 }}>
                Total nilai pembayaran terverifikasi:{" "}
                <strong>Rp {formatRupiah(summary.nilaiLunas)}</strong> — dijumlahkan dari
                pesanan yang berstatus <code>lunas</code> saja. Pesanan pending, menunggu
                verifikasi, dan gagal tidak ikut dihitung, sehingga angka ini berubah
                setiap kali kamu memverifikasi atau menolak pembayaran.
            </div>

            {/* ── Toolbar ── */}
            <div className="admin-toolbar">
                <div className="admin-search">
                    <i className="bi bi-search" aria-hidden="true" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari order ID, kode transaksi, atau nama pelanggan…"
                        aria-label="Cari pembayaran"
                    />
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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

            {/* ── Tabel ── */}
            {loadError ? (
                <EmptyState
                    tone="error"
                    title="Data belum termuat"
                    description={loadError}
                    action={
                        <button className="btn btn-primary" onClick={fetchPesanan}>
                            Coba lagi
                        </button>
                    }
                />
            ) : !loading && hasil.length === 0 ? (
                <EmptyState
                    title={pesanan.length === 0 ? "Belum ada pesanan" : "Tidak ada yang cocok"}
                    description={
                        pesanan.length === 0
                            ? "Pembayaran akan muncul di sini setelah ada pesanan masuk."
                            : "Coba ubah kata kunci atau pilih filter status yang lain."
                    }
                    action={
                        pesanan.length > 0 ? (
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    setSearch("");
                                    setFilter("semua");
                                }}
                            >
                                Atur ulang filter
                            </button>
                        ) : null
                    }
                />
            ) : (
                <div className="panel">
                    <div className="table-wrap">
                        <table className="a-table">
                            <thead>
                                <tr>
                                    <th>Order</th>
                                    <th>Pelanggan</th>
                                    <th>Tanggal</th>
                                    <th>Total</th>
                                    <th>Metode</th>
                                    <th>Status</th>
                                    <th>Bukti</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <>
                                        <TableRowSkeleton columns={8} />
                                        <TableRowSkeleton columns={8} />
                                        <TableRowSkeleton columns={8} />
                                    </>
                                ) : (
                                    hasil.map((item) => {
                                        const status = paymentStatus(item.status_pembayaran);

                                        return (
                                            <tr key={item.id_pesanan}>
                                                <td>
                                                    <div className="cell-strong">#{item.id_pesanan}</div>
                                                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                                        {item.kode_transaksi || "—"}
                                                    </div>
                                                </td>
                                                <td>{item.user?.nama || item.user?.name || `User #${item.id_user}`}</td>
                                                <td style={{ fontSize: 13 }}>
                                                    {item.created_at || item.tanggal_transaksi
                                                        ? new Date(
                                                              item.created_at || item.tanggal_transaksi
                                                          ).toLocaleDateString("id-ID")
                                                        : "—"}
                                                </td>
                                                <td className="cell-strong">Rp {formatRupiah(item.total_harga)}</td>
                                                <td>
                                                    <span className="badge badge-mint">
                                                        {methodLabel(item.metode_pembayaran)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${status.badge}`}>{status.label}</span>
                                                </td>
                                                <td>
                                                    {item.bukti_pembayaran ? (
                                                        <span className="badge badge-success">Ada</span>
                                                    ) : (
                                                        <span className="caption">Belum ada</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="cell-actions">
                                                        <button
                                                            type="button"
                                                            className="btn btn-primary btn-xs"
                                                            onClick={() => setReview(item)}
                                                        >
                                                            <i className="bi bi-search" aria-hidden="true" />
                                                            Periksa Pembayaran
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
                </div>
            )}

            {review && (
                <BuktiPembayaranModal
                    pesanan={review}
                    saving={saving}
                    onVerify={() => ubahStatus("lunas")}
                    onReject={(alasan) => ubahStatus("gagal", alasan)}
                    onClose={() => !saving && setReview(null)}
                />
            )}

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

export default PembayaranListPage;
