import React, { useCallback, useEffect, useState } from "react";
import api from "../../api/axios";
import EmptyState from "../../components/common/EmptyState";
import ConfirmModal from "../../components/common/ConfirmModal";
import Toast from "../../components/ui/Toast";
import { TableRowSkeleton } from "../../components/ui/Skeleton";
import { StickerInline } from "../../components/common/Sticker";
import "../AdminPages.css";

const ukuran = (bytes) => {
    const b = Number(bytes || 0);
    if (b >= 1024 * 1024) return `${(b / 1024 / 1024).toFixed(2)} MB`;
    if (b >= 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${b} B`;
};

/**
 * Admin → Backup Database.
 *
 * Semua aksi memanggil endpoint backend yang benar-benar menjalankan
 * `mysqldump` / `mysql`. Tidak ada backup versi frontend: tidak ada
 * localStorage, tidak ada JSON yang diganti ekstensinya.
 *
 * Kalau `mysqldump` tidak ada di PATH server, backend mengembalikan error
 * dan halaman ini menampilkannya apa adanya — tidak pernah mengaku sukses.
 */
const BackupPage = () => {
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({ total: 0, total_ukuran: 0, terakhir: null, driver: "" });
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [membuat, setMembuat] = useState(false);
    const [konfirmasiBackup, setKonfirmasiBackup] = useState(false);
    const [restoreTarget, setRestoreTarget] = useState(null);
    const [hapusTarget, setHapusTarget] = useState(null);
    const [aksiJalan, setAksiJalan] = useState(false);
    const [toast, setToast] = useState({ message: "", type: "success" });

    const showToast = useCallback((message, type = "success", lama = 4200) => {
        setToast({ message, type });
        window.setTimeout(() => setToast({ message: "", type }), lama);
    }, []);

    const fetchBackup = useCallback(async () => {
        try {
            setLoading(true);
            setLoadError("");
            const response = await api.get("/backup");
            setItems(response.data?.data || []);
            setMeta(response.data?.meta || { total: 0, total_ukuran: 0, terakhir: null, driver: "" });
        } catch (error) {
            console.error("Gagal mengambil daftar backup:", error);
            setItems([]);
            setLoadError(
                error.response?.status === 403
                    ? "Akunmu tidak punya akses ke fitur backup."
                    : error.response?.data?.message ||
                          "Daftar backup belum bisa dimuat. Periksa koneksi ke server."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBackup();
    }, [fetchBackup]);

    /* ----------------------------------------------------- buat backup */
    const buatBackup = async () => {
        try {
            setMembuat(true);
            const response = await api.post("/backup");
            setKonfirmasiBackup(false);
            showToast(
                `Backup berhasil dibuat: ${response.data?.data?.nama_file || "file baru"}`,
                "success"
            );
            await fetchBackup();
        } catch (error) {
            console.error("Gagal membuat backup:", error);
            setKonfirmasiBackup(false);
            showToast(
                error.response?.data?.error ||
                    error.response?.data?.message ||
                    "Database backup gagal. Silakan coba lagi.",
                "error",
                7000
            );
        } finally {
            setMembuat(false);
        }
    };

    /* ---------------------------------------------------------- unduh */
    const unduh = async (nama) => {
        try {
            // Endpoint butuh Bearer token, jadi tidak bisa dibuka lewat <a href>
            // biasa — file diambil sebagai blob lalu diunduh dari memori.
            const response = await api.get(`/backup/${nama}/download`, { responseType: "blob" });

            const url = URL.createObjectURL(response.data);
            const a = document.createElement("a");
            a.href = url;
            a.download = nama;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);

            showToast("Backup diunduh.", "success");
        } catch (error) {
            console.error("Gagal mengunduh backup:", error);
            showToast("Gagal mengunduh file backup.", "error");
        }
    };

    /* -------------------------------------------------------- restore */
    const restore = async () => {
        if (!restoreTarget) return;

        try {
            setAksiJalan(true);
            const response = await api.post(`/backup/${restoreTarget.nama_file}/restore`, {
                konfirmasi: "RESTORE",
            });

            const pengaman = response.data?.data?.backup_pengaman;
            setRestoreTarget(null);
            showToast(
                pengaman
                    ? `Database dipulihkan. Kondisi sebelumnya disimpan sebagai ${pengaman}.`
                    : "Database berhasil dipulihkan.",
                "success",
                8000
            );
            await fetchBackup();
        } catch (error) {
            console.error("Gagal restore:", error);
            showToast(
                error.response?.data?.error ||
                    error.response?.data?.message ||
                    "Restore database gagal.",
                "error",
                8000
            );
        } finally {
            setAksiJalan(false);
        }
    };

    /* ---------------------------------------------------------- hapus */
    const hapus = async () => {
        if (!hapusTarget) return;

        try {
            setAksiJalan(true);
            await api.delete(`/backup/${hapusTarget.nama_file}`);
            setHapusTarget(null);
            showToast("Backup dihapus.", "info");
            await fetchBackup();
        } catch (error) {
            console.error("Gagal menghapus backup:", error);
            showToast("Gagal menghapus backup.", "error");
        } finally {
            setAksiJalan(false);
        }
    };

    const stats = [
        {
            label: "Backup Terakhir",
            value: meta.terakhir ? new Date(meta.terakhir).toLocaleString("id-ID") : "Belum ada",
            sticker: "tape",
        },
        { label: "Total Backup", value: meta.total ?? 0, sticker: "leaf" },
        { label: "Total Ukuran", value: ukuran(meta.total_ukuran), sticker: "star" },
    ];

    return (
        <div>
            <header className="admin-head">
                <div>
                    <span className="eyebrow">Sistem</span>
                    <h1>Backup Database</h1>
                    <p>Kelola pencadangan dan pemulihan database aplikasi.</p>
                </div>
                <div className="admin-head-actions">
                    <button type="button" className="btn btn-outline btn-sm" onClick={fetchBackup}>
                        <i className="bi bi-arrow-clockwise" aria-hidden="true" />
                        Muat ulang
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => setKonfirmasiBackup(true)}
                        disabled={membuat}
                    >
                        {membuat && <span className="spin" />}
                        <i className="bi bi-plus-lg" aria-hidden="true" />
                        {membuat ? "Membuat..." : "Backup Sekarang"}
                    </button>
                </div>
            </header>

            <div className="admin-stats">
                {stats.map((s) => (
                    <div className="admin-stat" key={s.label}>
                        <span className="admin-stat-icon">
                            <StickerInline name={s.sticker} size={24} />
                        </span>
                        <span>
                            <span className="admin-stat-value" style={{ fontSize: 17 }}>
                                {loading ? "—" : s.value}
                            </span>
                            <span className="admin-stat-label">{s.label}</span>
                        </span>
                    </div>
                ))}
            </div>

            <div className="note-card" style={{ marginBottom: 22 }}>
                Backup dibuat dengan <code>mysqldump</code> dan menghasilkan file <code>.sql</code>{" "}
                sungguhan yang bisa di-import lewat phpMyAdmin. File disimpan di luar folder{" "}
                <code>public</code>, jadi tidak bisa diunduh lewat URL langsung — hanya lewat
                tombol Unduh di bawah, yang tetap memeriksa otorisasi.
                {meta.driver && meta.driver !== "mysql" && (
                    <>
                        {" "}
                        <strong>
                            Perhatian: driver database terbaca sebagai “{meta.driver}”, sementara backup
                            otomatis hanya mendukung MySQL.
                        </strong>
                    </>
                )}
            </div>

            {loadError ? (
                <EmptyState
                    tone="error"
                    title="Daftar backup belum termuat"
                    description={loadError}
                    action={
                        <button className="btn btn-primary" onClick={fetchBackup}>
                            Coba lagi
                        </button>
                    }
                />
            ) : !loading && items.length === 0 ? (
                <EmptyState
                    sticker="leaf"
                    title="Belum ada backup"
                    description="Klik “Backup Sekarang” untuk membuat cadangan database pertama."
                    action={
                        <button className="btn btn-primary" onClick={() => setKonfirmasiBackup(true)}>
                            Backup Sekarang
                        </button>
                    }
                />
            ) : (
                <div className="panel">
                    <div className="panel-head">
                        <h3>Riwayat backup</h3>
                    </div>
                    <div className="table-wrap">
                        <table className="a-table">
                            <thead>
                                <tr>
                                    <th>Nama File</th>
                                    <th>Tanggal</th>
                                    <th>Ukuran</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <>
                                        <TableRowSkeleton columns={5} />
                                        <TableRowSkeleton columns={5} />
                                    </>
                                ) : (
                                    items.map((b) => (
                                        <tr key={b.nama_file}>
                                            <td className="cell-strong" style={{ wordBreak: "break-all", fontSize: 13 }}>
                                                {b.nama_file}
                                            </td>
                                            <td style={{ fontSize: 13 }}>
                                                {new Date(b.dibuat_pada).toLocaleString("id-ID")}
                                            </td>
                                            <td>{ukuran(b.ukuran)}</td>
                                            <td>
                                                <span
                                                    className={`badge ${b.status === "success" ? "badge-success" : "badge-error"}`}
                                                >
                                                    {b.status === "success" ? "Berhasil" : "Gagal"}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="cell-actions">
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline btn-xs"
                                                        onClick={() => unduh(b.nama_file)}
                                                    >
                                                        <i className="bi bi-download" aria-hidden="true" />
                                                        Unduh
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-mint btn-xs"
                                                        onClick={() => setRestoreTarget(b)}
                                                    >
                                                        Restore
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-ghost btn-xs"
                                                        style={{ color: "var(--error)" }}
                                                        onClick={() => setHapusTarget(b)}
                                                    >
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
                </div>
            )}

            {/* ── Konfirmasi buat backup ── */}
            <ConfirmModal
                open={konfirmasiBackup}
                tone="neutral"
                title="Backup database sekarang?"
                description="Data database saat ini akan dicadangkan ke file .sql. Proses ini bisa memakan waktu beberapa saat untuk database besar."
                confirmLabel="Backup Now"
                cancelLabel="Batal"
                loading={membuat}
                onConfirm={buatBackup}
                onCancel={() => !membuat && setKonfirmasiBackup(false)}
            />

            {/* ── Konfirmasi restore ── */}
            <ConfirmModal
                open={Boolean(restoreTarget)}
                tone="danger"
                title="Restore Database?"
                description={
                    restoreTarget
                        ? `Restore akan mengganti data database saat ini dengan isi ${restoreTarget.nama_file}. Sistem membuat backup pengaman lebih dulu — kalau backup pengaman gagal, restore dibatalkan. Pastikan kamu benar-benar ingin melanjutkan.`
                        : ""
                }
                confirmLabel="Restore Database"
                cancelLabel="Batal"
                loading={aksiJalan}
                onConfirm={restore}
                onCancel={() => !aksiJalan && setRestoreTarget(null)}
            />

            {/* ── Konfirmasi hapus ── */}
            <ConfirmModal
                open={Boolean(hapusTarget)}
                tone="danger"
                title="Hapus backup ini?"
                description={
                    hapusTarget
                        ? `${hapusTarget.nama_file} akan dihapus permanen dari server. Backup lain tidak terpengaruh.`
                        : ""
                }
                confirmLabel="Hapus"
                loading={aksiJalan}
                onConfirm={hapus}
                onCancel={() => !aksiJalan && setHapusTarget(null)}
            />

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

export default BackupPage;
