import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import EmptyState from "../../components/common/EmptyState";
import Toast from "../../components/ui/Toast";
import { SkeletonBox, TableRowSkeleton } from "../../components/ui/Skeleton";
import { StickerInline } from "../../components/common/Sticker";
import { BarChart, LineChart, CompositionBars } from "../../components/common/Charts";
import { formatRupiah } from "../../components/common/media";
import { orderItems } from "../../lib/order";
import { methodLabel, paymentStatus, PAYMENT_STATUS } from "../../config/payment";
import "../AdminPages.css";

const NAMA_BULAN = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const iso = (d) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

/** Rentang tanggal untuk tiap preset. */
const rentang = (mode, bulan, tahun, tanggal, custom) => {
    const hariIni = new Date();

    if (mode === "harian") {
        const d = tanggal ? new Date(tanggal) : hariIni;
        return { start: iso(d), end: iso(d) };
    }

    if (mode === "mingguan") {
        const d = tanggal ? new Date(tanggal) : hariIni;
        // Senin sebagai awal minggu.
        const offset = (d.getDay() + 6) % 7;
        const senin = new Date(d);
        senin.setDate(d.getDate() - offset);
        const minggu = new Date(senin);
        minggu.setDate(senin.getDate() + 6);
        return { start: iso(senin), end: iso(minggu) };
    }

    if (mode === "custom") {
        return { start: custom.start, end: custom.end };
    }

    // bulanan
    return {
        start: iso(new Date(tahun, bulan, 1)),
        end: iso(new Date(tahun, bulan + 1, 0)),
    };
};

/**
 * Admin → Laporan.
 *
 * Seluruh angka berasal dari `GET /laporan`, yang menghitung SUM/COUNT/GROUP BY
 * di database. Frontend tidak menarik ribuan baris lalu menjumlahkannya sendiri.
 *
 * Export Excel dan cetak memakai periode + filter yang sedang aktif, lewat
 * `GET /laporan/export` yang mengembalikan seluruh baris pada periode itu.
 */
const LaporanPage = () => {
    const kini = new Date();

    const [mode, setMode] = useState("bulanan");
    const [bulan, setBulan] = useState(kini.getMonth());
    const [tahun, setTahun] = useState(kini.getFullYear());
    const [tanggal, setTanggal] = useState(iso(kini));
    const [custom, setCustom] = useState({ start: iso(new Date(kini.getFullYear(), kini.getMonth(), 1)), end: iso(kini) });

    const [filter, setFilter] = useState({
        status_pembayaran: "",
        status_pengiriman: "",
        metode_pembayaran: "",
        search: "",
    });

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [page, setPage] = useState(1);
    const [exporting, setExporting] = useState(false);
    const [toast, setToast] = useState({ message: "", type: "success" });

    const periode = useMemo(
        () => rentang(mode, bulan, tahun, tanggal, custom),
        [mode, bulan, tahun, tanggal, custom]
    );

    const showToast = useCallback((message, type = "success") => {
        setToast({ message, type });
        window.setTimeout(() => setToast({ message: "", type }), 3600);
    }, []);

    const params = useCallback(
        (extra = {}) => {
            const p = { start: periode.start, end: periode.end, ...extra };
            Object.entries(filter).forEach(([k, v]) => {
                if (v) p[k] = v;
            });
            return p;
        },
        [periode, filter]
    );

    const fetchLaporan = useCallback(async () => {
        if (!periode.start || !periode.end) return;

        try {
            setLoading(true);
            setLoadError("");
            const response = await api.get("/laporan", { params: params({ page, per_page: 25 }) });
            setData(response.data?.data || null);
        } catch (error) {
            console.error("Gagal mengambil laporan:", error);
            setData(null);
            const errors = error.response?.data?.errors;
            setLoadError(
                errors
                    ? Object.values(errors).flat().join(" ")
                    : error.response?.data?.message ||
                          "Laporan belum bisa dimuat. Periksa koneksi ke server."
            );
        } finally {
            setLoading(false);
        }
    }, [periode, params, page]);

    useEffect(() => {
        fetchLaporan();
    }, [fetchLaporan]);

    /* Kembali ke halaman 1 setiap kali periode atau filter berubah. */
    useEffect(() => {
        setPage(1);
    }, [mode, bulan, tahun, tanggal, custom, filter]);

    const r = data?.ringkasan;

    const labelPeriode = useMemo(() => {
        if (mode === "bulanan") return `${NAMA_BULAN[bulan]} ${tahun}`;
        if (mode === "harian") return new Date(periode.start).toLocaleDateString("id-ID", { dateStyle: "long" });
        const a = new Date(periode.start).toLocaleDateString("id-ID");
        const b = new Date(periode.end).toLocaleDateString("id-ID");
        return `${a} – ${b}`;
    }, [mode, bulan, tahun, periode]);

    const chartHarian = useMemo(
        () =>
            (data?.harian || []).map((h) => ({
                label: new Date(h.tanggal).getDate().toString(),
                value: Number(h.pendapatan || 0),
            })),
        [data]
    );

    const chartOrder = useMemo(
        () =>
            (data?.harian || []).map((h) => ({
                label: new Date(h.tanggal).getDate().toString(),
                value: Number(h.jumlah_order || 0),
            })),
        [data]
    );

    const chartMetode = useMemo(
        () =>
            (data?.metode || []).map((m) => ({
                label: methodLabel(m.metode_pembayaran),
                value: Number(m.jumlah || 0),
            })),
        [data]
    );

    /* ------------------------------------------------------- export */
    const ambilSemuaTransaksi = async () => {
        const response = await api.get("/laporan/export", { params: params() });
        return {
            rows: response.data?.data || [],
            terpotong: Boolean(response.data?.meta?.terpotong),
        };
    };

    const handleExcel = async () => {
        try {
            setExporting(true);

            const { rows, terpotong } = await ambilSemuaTransaksi();

            if (rows.length === 0) {
                showToast("Tidak ada transaksi pada periode ini — export dibatalkan.", "warning");
                return;
            }

            // Modul xlsx dimuat saat dibutuhkan saja, supaya tidak membebani
            // bundle halaman lain yang tidak pernah mengekspor apa pun.
            const { exportLaporanExcel } = await import("../../lib/exportExcel");

            const nama = exportLaporanExcel({
                ringkasan: r || {},
                transaksi: rows,
                topProduk: data?.top_produk || [],
                harian: data?.harian || [],
                periode,
            });

            showToast(
                terpotong
                    ? `${nama} dibuat, tapi data dipotong di 5.000 baris.`
                    : `${nama} berhasil diunduh.`,
                terpotong ? "warning" : "success"
            );
        } catch (error) {
            console.error("Gagal export Excel:", error);
            showToast(
                error?.message?.includes("Failed to fetch dynamically imported module")
                    ? "Modul xlsx belum terpasang. Jalankan npm install lalu coba lagi."
                    : "Gagal membuat file Excel.",
                "error"
            );
        } finally {
            setExporting(false);
        }
    };

    const handlePrint = () => window.print();

    /* -------------------------------------------------------- render */
    const kartu = [
        { label: "Total Pesanan", value: r?.total_order ?? 0, sticker: "leaf" },
        { label: "Pendapatan (lunas)", value: `Rp ${formatRupiah(r?.pendapatan)}`, sticker: "sparkle" },
        { label: "Produk Terjual", value: r?.produk_terjual ?? 0, sticker: "star" },
        {
            label: "Rata-rata Order",
            // null = belum ada order lunas. Jangan tampilkan Rp0 tanpa konteks.
            value: r?.rata_rata_order == null ? "—" : `Rp ${formatRupiah(r.rata_rata_order)}`,
            sticker: "heart",
        },
    ];

    const kartuStatus = [
        { label: "Lunas", value: r?.lunas ?? 0, badge: "badge-success" },
        { label: "Menunggu Verifikasi", value: r?.menunggu_verifikasi ?? 0, badge: "badge-info" },
        { label: "Belum Dibayar", value: r?.pending ?? 0, badge: "badge-warning" },
        { label: "Gagal", value: r?.gagal ?? 0, badge: "badge-error" },
    ];

    const kosong = !loading && !loadError && (r?.total_order ?? 0) === 0;

    return (
        <div className="laporan-page">
            {/* ── Kepala halaman (tidak ikut tercetak) ── */}
            <header className="admin-head no-print">
                <div>
                    <span className="eyebrow">Analitik</span>
                    <h1>Laporan Penjualan</h1>
                    <p>Ringkasan, tren, dan detail transaksi berdasarkan periode yang kamu pilih.</p>
                </div>
                <div className="admin-head-actions">
                    <button type="button" className="btn btn-outline btn-sm" onClick={handlePrint} disabled={loading}>
                        <i className="bi bi-printer" aria-hidden="true" />
                        Cetak Laporan
                    </button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={handleExcel} disabled={loading || exporting}>
                        {exporting && <span className="spin" />}
                        <i className="bi bi-file-earmark-spreadsheet" aria-hidden="true" />
                        {exporting ? "Menyiapkan..." : "Export Excel"}
                    </button>
                </div>
            </header>

            {/* ── Filter periode (tidak ikut tercetak) ── */}
            <div className="panel no-print" style={{ marginBottom: 24 }}>
                <div className="panel-body">
                    <div className="periode-tabs" role="tablist" aria-label="Jenis periode">
                        {[
                            { id: "harian", label: "Harian" },
                            { id: "mingguan", label: "Mingguan" },
                            { id: "bulanan", label: "Bulanan" },
                            { id: "custom", label: "Custom" },
                        ].map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                role="tab"
                                aria-selected={mode === t.id}
                                className={`filter-pill ${mode === t.id ? "active" : ""}`}
                                onClick={() => setMode(t.id)}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="laporan-filters">
                        {(mode === "harian" || mode === "mingguan") && (
                            <div>
                                <label className="form-label" htmlFor="tgl">
                                    {mode === "harian" ? "Tanggal" : "Tanggal dalam minggu"}
                                </label>
                                <input
                                    id="tgl"
                                    type="date"
                                    className="form-control"
                                    value={tanggal}
                                    onChange={(e) => setTanggal(e.target.value)}
                                />
                            </div>
                        )}

                        {mode === "bulanan" && (
                            <>
                                <div>
                                    <label className="form-label" htmlFor="bln">Bulan</label>
                                    <select
                                        id="bln"
                                        className="form-select"
                                        value={bulan}
                                        onChange={(e) => setBulan(Number(e.target.value))}
                                    >
                                        {NAMA_BULAN.map((b, i) => (
                                            <option key={b} value={i}>{b}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label" htmlFor="thn">Tahun</label>
                                    <select
                                        id="thn"
                                        className="form-select"
                                        value={tahun}
                                        onChange={(e) => setTahun(Number(e.target.value))}
                                    >
                                        {Array.from({ length: 6 }, (_, i) => kini.getFullYear() - i).map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}

                        {mode === "custom" && (
                            <>
                                <div>
                                    <label className="form-label" htmlFor="dari">Dari tanggal</label>
                                    <input
                                        id="dari"
                                        type="date"
                                        className="form-control"
                                        value={custom.start}
                                        max={custom.end}
                                        onChange={(e) => setCustom({ ...custom, start: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="form-label" htmlFor="sampai">Sampai tanggal</label>
                                    <input
                                        id="sampai"
                                        type="date"
                                        className="form-control"
                                        value={custom.end}
                                        min={custom.start}
                                        onChange={(e) => setCustom({ ...custom, end: e.target.value })}
                                    />
                                </div>
                            </>
                        )}

                        <div>
                            <label className="form-label" htmlFor="f-bayar">Status pembayaran</label>
                            <select
                                id="f-bayar"
                                className="form-select"
                                value={filter.status_pembayaran}
                                onChange={(e) => setFilter({ ...filter, status_pembayaran: e.target.value })}
                            >
                                <option value="">Semua</option>
                                {Object.entries(PAYMENT_STATUS).map(([id, s]) => (
                                    <option key={id} value={id}>{s.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="form-label" htmlFor="f-kirim">Status pesanan</label>
                            <select
                                id="f-kirim"
                                className="form-select"
                                value={filter.status_pengiriman}
                                onChange={(e) => setFilter({ ...filter, status_pengiriman: e.target.value })}
                            >
                                <option value="">Semua</option>
                                {["dikemas", "dikirim", "selesai", "dibatalkan"].map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="form-label" htmlFor="f-metode">Metode</label>
                            <select
                                id="f-metode"
                                className="form-select"
                                value={filter.metode_pembayaran}
                                onChange={(e) => setFilter({ ...filter, metode_pembayaran: e.target.value })}
                            >
                                <option value="">Semua</option>
                                <option value="transfer_bank">Transfer Bank</option>
                                <option value="ewallet">E-Wallet</option>
                                <option value="cod">COD</option>
                            </select>
                        </div>

                        <div>
                            <label className="form-label" htmlFor="f-cari">Cari</label>
                            <input
                                id="f-cari"
                                type="search"
                                className="form-control"
                                value={filter.search}
                                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                                placeholder="Customer atau kode transaksi"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Kop cetak (hanya muncul saat print) ── */}
            <div className="print-only print-head">
                <h1>ATELIER</h1>
                <h2>Laporan Penjualan</h2>
                <p>Periode: {labelPeriode}</p>
                <p>Dicetak: {new Date().toLocaleString("id-ID")}</p>
            </div>

            {loadError ? (
                <EmptyState
                    tone="error"
                    title="Laporan belum termuat"
                    description={loadError}
                    action={
                        <button className="btn btn-primary" onClick={fetchLaporan}>
                            Coba lagi
                        </button>
                    }
                />
            ) : loading ? (
                <>
                    <div className="admin-stats">
                        {[0, 1, 2, 3].map((i) => (
                            <SkeletonBox key={i} height={92} radius="var(--radius-xl)" />
                        ))}
                    </div>
                    <div style={{ height: 20 }} />
                    <SkeletonBox height={280} radius="var(--radius-xl)" />
                </>
            ) : kosong ? (
                <EmptyState
                    sticker="leaf"
                    title="Belum ada transaksi pada periode ini"
                    description={`Tidak ditemukan pesanan untuk ${labelPeriode}. Coba pilih periode lain atau longgarkan filternya.`}
                />
            ) : (
                <>
                    <p className="laporan-periode">
                        Periode aktif: <strong>{labelPeriode}</strong>
                    </p>

                    {/* ── Ringkasan ── */}
                    <div className="admin-stats">
                        {kartu.map((k) => (
                            <div className="admin-stat" key={k.label}>
                                <span className="admin-stat-icon">
                                    <StickerInline name={k.sticker} size={24} />
                                </span>
                                <span>
                                    <span className="admin-stat-value">{k.value}</span>
                                    <span className="admin-stat-label">{k.label}</span>
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="status-strip">
                        {kartuStatus.map((s) => (
                            <div key={s.label}>
                                <span className={`badge ${s.badge}`}>{s.label}</span>
                                <strong>{s.value}</strong>
                            </div>
                        ))}
                    </div>

                    {/* ── Grafik ── */}
                    <div className="laporan-grid">
                        <div className="panel">
                            <div className="panel-head">
                                <h3>Pendapatan per tanggal</h3>
                            </div>
                            <div className="panel-body">
                                <LineChart
                                    data={chartHarian}
                                    valueFormat={(v) => `Rp ${formatRupiah(v)}`}
                                />
                            </div>
                        </div>

                        <div className="panel">
                            <div className="panel-head">
                                <h3>Jumlah pesanan per tanggal</h3>
                            </div>
                            <div className="panel-body">
                                <BarChart data={chartOrder} valueFormat={(v) => `${v} pesanan`} />
                            </div>
                        </div>

                        <div className="panel">
                            <div className="panel-head">
                                <h3>Metode pembayaran</h3>
                            </div>
                            <div className="panel-body">
                                <CompositionBars data={chartMetode} valueFormat={(v) => `${v} pesanan`} />
                            </div>
                        </div>

                        <div className="panel">
                            <div className="panel-head">
                                <h3>Produk terlaris</h3>
                            </div>
                            <div className="panel-body">
                                {(data?.top_produk || []).length === 0 ? (
                                    <p className="state-inline">Belum ada produk terjual pada periode ini.</p>
                                ) : (
                                    <div className="table-wrap">
                                        <table className="a-table" style={{ minWidth: 380 }}>
                                            <thead>
                                                <tr>
                                                    <th>Produk</th>
                                                    <th>Qty Terjual</th>
                                                    <th>Pendapatan</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(data?.top_produk || []).map((p) => (
                                                    <tr key={p.id_produk}>
                                                        <td className="cell-strong">{p.nama_produk}</td>
                                                        <td>{p.qty}</td>
                                                        <td>Rp {formatRupiah(p.pendapatan)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Detail transaksi ── */}
                    <div className="panel" style={{ marginTop: 24 }}>
                        <div className="panel-head">
                            <h3>Detail transaksi</h3>
                            <span className="caption">
                                {data?.pagination?.total ?? 0} transaksi
                            </span>
                        </div>

                        <div className="table-wrap">
                            <table className="a-table" style={{ minWidth: 940 }}>
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>Tanggal</th>
                                        <th>No Pesanan</th>
                                        <th>Customer</th>
                                        <th>Produk</th>
                                        <th>Metode</th>
                                        <th>Pembayaran</th>
                                        <th>Pesanan</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(data?.transaksi || []).map((p, i) => {
                                        const items = orderItems(p);
                                        const st = paymentStatus(p.status_pembayaran);
                                        const nomor =
                                            ((data?.pagination?.current_page ?? 1) - 1) *
                                                (data?.pagination?.per_page ?? 25) + i + 1;

                                        return (
                                            <tr key={p.id_pesanan}>
                                                <td>{nomor}</td>
                                                <td style={{ fontSize: 13 }}>
                                                    {p.created_at
                                                        ? new Date(p.created_at).toLocaleDateString("id-ID")
                                                        : "—"}
                                                </td>
                                                <td className="cell-strong">{p.kode_transaksi || `#${p.id_pesanan}`}</td>
                                                <td>{p.user?.nama || p.user?.name || `User #${p.id_user}`}</td>
                                                <td style={{ fontSize: 13 }}>
                                                    {items.length === 0
                                                        ? "—"
                                                        : items
                                                              .map((it) => `${it.nama} ×${it.jumlah}`)
                                                              .join(", ")}
                                                </td>
                                                <td>{methodLabel(p.metode_pembayaran)}</td>
                                                <td>
                                                    <span className={`badge ${st.badge}`}>{st.label}</span>
                                                </td>
                                                <td style={{ fontSize: 13 }}>{p.status_pengiriman || "—"}</td>
                                                <td className="cell-strong">Rp {formatRupiah(p.total_harga)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {(data?.pagination?.last_page ?? 1) > 1 && (
                            <div className="panel-body no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                                <span className="caption">
                                    Halaman {data.pagination.current_page} dari {data.pagination.last_page}
                                </span>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button
                                        type="button"
                                        className="btn btn-outline btn-sm"
                                        disabled={data.pagination.current_page <= 1}
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    >
                                        Sebelumnya
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline btn-sm"
                                        disabled={data.pagination.current_page >= data.pagination.last_page}
                                        onClick={() => setPage((p) => p + 1)}
                                    >
                                        Berikutnya
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            <div className="toast-container no-print">
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ message: "", type: "success" })}
                />
            </div>
        </div>
    );
};

export default LaporanPage;
