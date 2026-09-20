import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { CardSkeleton, TableRowSkeleton } from "../components/ui/Skeleton";
import EmptyState from "../components/common/EmptyState";
import { StickerInline } from "../components/common/Sticker";
import { formatRupiah } from "../components/common/media";
import { getUserName, greeting } from "../lib/store";
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

const DashboardPage = () => {
    const navigate = useNavigate();

    const [produk, setProduk] = useState([]);
    const [kategori, setKategori] = useState([]);
    const [pesanan, setPesanan] = useState([]);
    const [userMeta, setUserMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchDashboard = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            // `allSettled` supaya satu endpoint yang gagal tidak
            // mengosongkan seluruh dashboard.
            const [produkRes, kategoriRes, pesananRes, usersRes] = await Promise.allSettled([
                api.get(`/produk`),
                api.get(`/kategori`),
                api.get(`/pesanan`),
                api.get(`/users`),
            ]);

            setProduk(produkRes.value?.data?.data || []);
            setKategori(kategoriRes.value?.data?.data || []);
            setPesanan(pesananRes.value?.data?.data || []);
            setUserMeta(usersRes.status === "fulfilled" ? usersRes.value?.data?.meta || null : null);

            if ([produkRes, kategoriRes, pesananRes].some((r) => r.status === "rejected")) {
                setError("Sebagian data belum bisa dimuat. Periksa koneksi ke server.");
            }
        } catch (err) {
            console.error("Dashboard data fetch error:", err);
            setError("Sebagian data belum bisa dimuat. Periksa koneksi ke server.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    const pendapatan = useMemo(
        () =>
            pesanan
                .filter((p) => String(p.status_pembayaran || "").toLowerCase() === "lunas")
                .reduce((sum, p) => sum + Number(p.total_harga || 0), 0),
        [pesanan]
    );

    /** Hitung per status pembayaran, memakai enum backend apa adanya. */
    const hitungStatus = useMemo(() => {
        const acc = { pending: 0, menunggu_verifikasi: 0, lunas: 0, gagal: 0 };
        pesanan.forEach((p) => {
            const key = String(p.status_pembayaran || "pending").toLowerCase();
            if (key in acc) acc[key] += 1;
        });
        return acc;
    }, [pesanan]);

    /**
     * Jumlah pesanan yang pembayarannya belum tuntas — dipakai di banner
     * peringatan. Diturunkan dari hitungStatus supaya sumber angkanya satu.
     */
    const menunggu = hitungStatus.pending + hitungStatus.menunggu_verifikasi;

    const stokMenipis = useMemo(
        () => produk.filter((p) => Number(p.stok || 0) <= 5).sort((a, b) => Number(a.stok || 0) - Number(b.stok || 0)),
        [produk]
    );

    const terbaru = useMemo(
        () =>
            [...pesanan]
                .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
                .slice(0, 6),
        [pesanan]
    );

    const stats = [
        { label: "Total pesanan", value: pesanan.length, sticker: "star", to: "/pesanan" },
        { label: "Total produk", value: produk.length, sticker: "pen", to: "/produk" },
        {
            label: "Total customer",
            // Endpoint /users hanya bisa diakses admin. Kalau gagal dimuat,
            // tampilkan "—" — jangan mengarang angka.
            value: userMeta?.customer ?? "—",
            sticker: "flower",
            to: "/pengguna",
        },
        { label: "Pendapatan (lunas)", value: `Rp ${formatRupiah(pendapatan)}`, sticker: "heart" },
        { label: "Menunggu verifikasi", value: hitungStatus.menunggu_verifikasi, sticker: "tape", to: "/pembayaran" },
        { label: "Belum dibayar", value: hitungStatus.pending, sticker: "ring", to: "/pembayaran" },
        { label: "Pembayaran lunas", value: hitungStatus.lunas, sticker: "sparkle", to: "/pembayaran" },
        { label: "Stok menipis", value: stokMenipis.length, sticker: "leaf", to: "/produk" },
    ];

    return (
        <div>
            <header className="admin-head">
                <div>
                    <span className="eyebrow">Atelier Studio</span>
                    <h1>
                        {greeting()}, {getUserName() || "Admin"}
                    </h1>
                    <p>Ringkasan katalog dan penjualan hari ini.</p>
                </div>

                <div className="admin-head-actions">
                    <button className="btn btn-outline btn-sm" onClick={fetchDashboard} disabled={loading}>
                        {loading ? <span className="spin" /> : <i className="bi bi-arrow-clockwise" aria-hidden="true" />}
                        Muat ulang
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate("/produk/tambah")}>
                        <i className="bi bi-plus-lg" aria-hidden="true" />
                        Produk baru
                    </button>
                </div>
            </header>

            {error && (
                <div className="note-card" style={{ marginBottom: 22, borderColor: "var(--error)", color: "var(--error)" }}>
                    <i className="bi bi-exclamation-triangle me-2" aria-hidden="true" />
                    {error}
                </div>
            )}

            {/* ── stats ── */}
            {loading ? (
                <div className="admin-stats">
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            ) : (
                <div className="admin-stats">
                    {stats.map((s) => (
                        <div
                            key={s.label}
                            className="admin-stat"
                            role={s.to ? "button" : undefined}
                            tabIndex={s.to ? 0 : undefined}
                            onClick={s.to ? () => navigate(s.to) : undefined}
                            onKeyDown={
                                s.to
                                    ? (e) => {
                                          if (e.key === "Enter" || e.key === " ") {
                                              e.preventDefault();
                                              navigate(s.to);
                                          }
                                      }
                                    : undefined
                            }
                            style={s.to ? { cursor: "pointer" } : undefined}
                        >
                            <span className="admin-stat-icon">
                                <StickerInline name={s.sticker} size={24} />
                            </span>
                            <span style={{ minWidth: 0 }}>
                                <span className="admin-stat-label" style={{ display: "block" }}>
                                    {s.label}
                                </span>
                                <span className="admin-stat-value" style={{ display: "block" }}>
                                    {s.value}
                                </span>
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* ── attention row ── */}
            {!loading && (menunggu > 0 || stokMenipis.length > 0) && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18, marginBottom: 30 }}>
                    {menunggu > 0 && (
                        <div className="note-card">
                            <strong style={{ display: "block", marginBottom: 4, fontFamily: "var(--font-display)" }}>
                                {menunggu} pesanan menunggu pembayaran
                            </strong>
                            <button className="auth-link" onClick={() => navigate("/pesanan")} style={{ marginTop: 6 }}>
                                Tinjau pesanan →
                            </button>
                        </div>
                    )}

                    {stokMenipis.length > 0 && (
                        <div className="note-card">
                            <strong style={{ display: "block", marginBottom: 4, fontFamily: "var(--font-display)" }}>
                                {stokMenipis.length} produk stoknya menipis
                            </strong>
                            <span className="body-s text-muted">
                                {stokMenipis
                                    .slice(0, 3)
                                    .map((p) => `${p.nama_produk} (${p.stok})`)
                                    .join(", ")}
                            </span>
                            <button className="auth-link" onClick={() => navigate("/produk")} style={{ display: "block", marginTop: 8 }}>
                                Kelola stok →
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── recent orders ── */}
            <section className="panel">
                <div className="panel-head">
                    <h3>Pesanan terbaru</h3>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate("/pesanan")}>
                        Semua pesanan
                        <i className="bi bi-arrow-right" aria-hidden="true" />
                    </button>
                </div>

                <div className="table-wrap">
                    <table className="a-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Pelanggan</th>
                                <th>Tanggal</th>
                                <th>Total</th>
                                <th>Pembayaran</th>
                                <th>Pengiriman</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <>
                                    <TableRowSkeleton columns={7} />
                                    <TableRowSkeleton columns={7} />
                                    <TableRowSkeleton columns={7} />
                                </>
                            ) : terbaru.length === 0 ? (
                                <tr>
                                    <td colSpan="7">
                                        <div className="state-inline">Belum ada pesanan yang masuk.</div>
                                    </td>
                                </tr>
                            ) : (
                                terbaru.map((item) => (
                                    <tr key={item.id_pesanan}>
                                        <td className="cell-strong">#{item.id_pesanan}</td>
                                        <td>{item.user?.nama || item.user?.name || `User #${item.id_user}`}</td>
                                        <td style={{ whiteSpace: "nowrap" }}>
                                            {item.created_at ? new Date(item.created_at).toLocaleDateString("id-ID") : "—"}
                                        </td>
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

            {!loading && pesanan.length === 0 && produk.length === 0 && (
                <EmptyState
                    title="Studio masih kosong"
                    description="Mulai dengan menambahkan kategori, lalu produk pertamamu."
                    action={
                        <button className="btn btn-primary" onClick={() => navigate("/kategori/create")}>
                            Tambah kategori
                        </button>
                    }
                />
            )}
        </div>
    );
};

export default DashboardPage;
