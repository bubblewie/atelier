import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import EmptyState from "../../components/common/EmptyState";
import ConfirmModal from "../../components/common/ConfirmModal";
import Toast from "../../components/ui/Toast";
import { TableRowSkeleton } from "../../components/ui/Skeleton";
import { StickerInline } from "../../components/common/Sticker";
import { getUser } from "../../lib/store";
import "../AdminPages.css";

const FILTERS = [
    { id: "semua", label: "Semua" },
    { id: "admin", label: "Admin" },
    { id: "customer", label: "Customer" },
];

/**
 * Admin → Pengguna.
 *
 * Data dari `GET /users` — endpoint admin-only. Password tidak pernah ikut
 * terkirim: model User mencantumkannya di `$hidden` dan controller memilih
 * kolom secara eksplisit, jadi tidak ada hash yang sampai ke browser.
 *
 * Perubahan role dikirim ke `PUT /users/{id}/role`, dan backend menolak
 * kalau aksinya akan membuat sistem kehabisan admin atau admin menurunkan
 * role dirinya sendiri.
 */
const PenggunaListPage = () => {
    const [users, setUsers] = useState([]);
    const [meta, setMeta] = useState({ total: 0, admin: 0, customer: 0 });
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [filter, setFilter] = useState("semua");
    const [search, setSearch] = useState("");

    const [confirm, setConfirm] = useState(null); // { user, roleBaru }
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState({ message: "", type: "success" });

    const aktor = getUser();

    const showToast = useCallback((message, type = "success") => {
        setToast({ message, type });
        window.setTimeout(() => setToast({ message: "", type }), 3600);
    }, []);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setLoadError("");
            const response = await api.get("/users");
            setUsers(response.data?.data || []);
            setMeta(response.data?.meta || { total: 0, admin: 0, customer: 0 });
        } catch (error) {
            console.error("Gagal mengambil pengguna:", error);
            setUsers([]);
            setLoadError(
                error.response?.status === 403
                    ? "Akunmu tidak punya akses ke manajemen pengguna."
                    : "Data pengguna belum bisa dimuat. Periksa koneksi ke server."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const hasil = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        return users.filter((u) => {
            const cocokFilter = filter === "semua" || u.role === filter;
            if (!keyword) return cocokFilter;
            const haystack = `${u.nama || ""} ${u.email || ""}`.toLowerCase();
            return cocokFilter && haystack.includes(keyword);
        });
    }, [users, filter, search]);

    const ubahRole = async () => {
        if (!confirm) return;

        try {
            setSaving(true);
            await api.put(`/users/${confirm.user.id_user}/role`, { role: confirm.roleBaru });
            showToast(
                `${confirm.user.nama} sekarang berperan sebagai ${confirm.roleBaru}`,
                "success"
            );
            setConfirm(null);
            await fetchUsers();
        } catch (error) {
            console.error("Gagal mengubah role:", error);
            showToast(
                error.response?.data?.message || "Gagal mengubah role pengguna.",
                "error"
            );
        } finally {
            setSaving(false);
        }
    };

    const stats = [
        { label: "Total Pengguna", value: meta.total, sticker: "flower" },
        { label: "Admin", value: meta.admin, sticker: "star" },
        { label: "Customer", value: meta.customer, sticker: "heart" },
    ];

    return (
        <div>
            <header className="admin-head">
                <div>
                    <span className="eyebrow">Akses</span>
                    <h1>Pengguna</h1>
                    <p>Kelola akun dan hak akses. Perubahan role langsung berlaku di backend.</p>
                </div>
                <div className="admin-head-actions">
                    <button type="button" className="btn btn-outline btn-sm" onClick={fetchUsers}>
                        <i className="bi bi-arrow-clockwise" aria-hidden="true" />
                        Muat ulang
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
                            <span className="admin-stat-value">{loading ? "—" : s.value}</span>
                            <span className="admin-stat-label">{s.label}</span>
                        </span>
                    </div>
                ))}
            </div>

            <div className="note-card" style={{ marginBottom: 22 }}>
                Sistem menjaga agar selalu ada minimal satu admin. Kamu tidak bisa menurunkan
                role akunmu sendiri, dan admin terakhir tidak bisa diturunkan atau dihapus —
                aturan ini dijalankan di backend, bukan sekadar disembunyikan di tampilan.
            </div>

            <div className="admin-toolbar">
                <div className="admin-search">
                    <i className="bi bi-search" aria-hidden="true" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari nama atau email…"
                        aria-label="Cari pengguna"
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

            {loadError ? (
                <EmptyState
                    tone="error"
                    title="Data belum termuat"
                    description={loadError}
                    action={
                        <button className="btn btn-primary" onClick={fetchUsers}>
                            Coba lagi
                        </button>
                    }
                />
            ) : !loading && hasil.length === 0 ? (
                <EmptyState
                    title={users.length === 0 ? "Belum ada pengguna" : "Tidak ada yang cocok"}
                    description={
                        users.length === 0
                            ? "Akun akan muncul di sini setelah ada yang mendaftar."
                            : "Coba ubah kata kunci atau pilih filter role lain."
                    }
                />
            ) : (
                <div className="panel">
                    <div className="table-wrap">
                        <table className="a-table">
                            <thead>
                                <tr>
                                    <th>Nama</th>
                                    <th>Email</th>
                                    <th>Telepon</th>
                                    <th>Role</th>
                                    <th>Terdaftar</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <>
                                        <TableRowSkeleton columns={6} />
                                        <TableRowSkeleton columns={6} />
                                        <TableRowSkeleton columns={6} />
                                    </>
                                ) : (
                                    hasil.map((u) => {
                                        const diriSendiri =
                                            Number(u.id_user) === Number(aktor?.id_user ?? aktor?.id);
                                        const adminTerakhir = u.role === "admin" && meta.admin <= 1;

                                        return (
                                            <tr key={u.id_user}>
                                                <td>
                                                    <div className="cell-strong">
                                                        {u.nama}
                                                        {diriSendiri && (
                                                            <span className="badge badge-mint" style={{ marginLeft: 8 }}>
                                                                Kamu
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>{u.email}</td>
                                                <td style={{ fontSize: 13 }}>{u.no_telepon || "—"}</td>
                                                <td>
                                                    <span
                                                        className={`badge ${u.role === "admin" ? "badge-cocoa" : "badge-mint"}`}
                                                    >
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: 13 }}>
                                                    {u.created_at
                                                        ? new Date(u.created_at).toLocaleDateString("id-ID")
                                                        : "—"}
                                                </td>
                                                <td>
                                                    <div className="cell-actions">
                                                        {u.role === "customer" ? (
                                                            <button
                                                                type="button"
                                                                className="btn btn-mint btn-xs"
                                                                onClick={() =>
                                                                    setConfirm({ user: u, roleBaru: "admin" })
                                                                }
                                                            >
                                                                Jadikan admin
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline btn-xs"
                                                                disabled={diriSendiri || adminTerakhir}
                                                                title={
                                                                    diriSendiri
                                                                        ? "Kamu tidak bisa menurunkan role sendiri"
                                                                        : adminTerakhir
                                                                          ? "Ini satu-satunya admin"
                                                                          : undefined
                                                                }
                                                                onClick={() =>
                                                                    setConfirm({ user: u, roleBaru: "customer" })
                                                                }
                                                            >
                                                                Jadikan customer
                                                            </button>
                                                        )}
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

            <ConfirmModal
                open={Boolean(confirm)}
                tone={confirm?.roleBaru === "admin" ? "neutral" : "danger"}
                title={confirm?.roleBaru === "admin" ? "Jadikan admin?" : "Turunkan jadi customer?"}
                description={
                    confirm
                        ? confirm.roleBaru === "admin"
                            ? `${confirm.user.nama} akan mendapat akses penuh ke panel admin, termasuk pembayaran dan backup database.`
                            : `${confirm.user.nama} akan kehilangan seluruh akses admin.`
                        : ""
                }
                confirmLabel={confirm?.roleBaru === "admin" ? "Ya, jadikan admin" : "Ya, turunkan"}
                loading={saving}
                onConfirm={ubahRole}
                onCancel={() => !saving && setConfirm(null)}
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

export default PenggunaListPage;
