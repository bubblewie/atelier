import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import EmptyState from "../../components/common/EmptyState";
import Toast from "../../components/ui/Toast";
import { SkeletonBox } from "../../components/ui/Skeleton";
import { StickerInline } from "../../components/common/Sticker";
import { BANK_ACCOUNTS, EWALLET_ACCOUNTS, usingDemoAccounts } from "../../config/payment";
import "../AdminPages.css";

const TABS = [
    { id: "profil", label: "Profil", icon: "bi-person" },
    { id: "keamanan", label: "Keamanan", icon: "bi-shield-lock" },
    { id: "pembayaran", label: "Pembayaran", icon: "bi-credit-card" },
    { id: "backup", label: "Backup & Restore", icon: "bi-hdd" },
];

/**
 * Admin → Settings.
 *
 * Profil dan kata sandi memakai endpoint `/profile` yang sama dengan customer —
 * backend selalu memakai user dari token, jadi admin pun hanya bisa mengubah
 * akunnya sendiri.
 *
 * Tab Pembayaran hanya MENAMPILKAN isi `src/config/payment.js`. Tidak ada form
 * simpan di sini: nilainya hidup di file, bukan di database, jadi form yang
 * "menyimpan" akan berbohong.
 */
const SettingsPage = () => {
    const navigate = useNavigate();

    const [tab, setTab] = useState("profil");

    const [profil, setProfil] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [form, setForm] = useState({ nama: "", email: "", no_telepon: "", alamat: "" });
    const [formErrors, setFormErrors] = useState({});
    const [savingProfil, setSavingProfil] = useState(false);

    const [pw, setPw] = useState({ password_lama: "", password: "", password_confirmation: "" });
    const [pwErrors, setPwErrors] = useState({});
    const [savingPw, setSavingPw] = useState(false);

    const [toast, setToast] = useState({ message: "", type: "success" });

    const showToast = useCallback((message, type = "success") => {
        setToast({ message, type });
        window.setTimeout(() => setToast({ message: "", type }), 3600);
    }, []);

    const isiForm = (d) =>
        setForm({
            nama: d?.nama || d?.name || "",
            email: d?.email || "",
            no_telepon: d?.no_telepon || "",
            alamat: d?.alamat || "",
        });

    const fetchProfil = useCallback(async () => {
        try {
            setLoading(true);
            setLoadError("");
            const response = await api.get("/profile");
            const d = response.data?.data || null;
            setProfil(d);
            isiForm(d);
        } catch (error) {
            console.error("Gagal mengambil profil:", error);
            setLoadError("Profil belum bisa dimuat. Periksa koneksi ke server.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfil();
    }, [fetchProfil]);

    const simpanProfil = async (e) => {
        e.preventDefault();
        setFormErrors({});

        try {
            setSavingProfil(true);
            const response = await api.put("/profile", {
                nama: form.nama.trim(),
                email: form.email.trim(),
                no_telepon: form.no_telepon.trim() || null,
                alamat: form.alamat.trim() || null,
            });

            const d = response.data?.data || null;
            setProfil(d);
            isiForm(d);

            try {
                const sesi = JSON.parse(localStorage.getItem("user") || "null");
                if (sesi && d) localStorage.setItem("user", JSON.stringify({ ...sesi, ...d }));
            } catch {
                // Sesi lokal rusak bukan alasan menggagalkan simpan yang sudah sukses.
            }

            showToast("Profil berhasil diperbarui", "success");
        } catch (error) {
            console.error("Gagal menyimpan profil:", error);
            setFormErrors(error.response?.data?.errors || {});
            showToast(
                error.response?.data?.message || "Gagal menyimpan profil. Isianmu masih tersimpan.",
                "error"
            );
        } finally {
            setSavingProfil(false);
        }
    };

    const gantiPassword = async (e) => {
        e.preventDefault();
        setPwErrors({});

        if (pw.password !== pw.password_confirmation) {
            setPwErrors({ password_confirmation: ["Konfirmasi kata sandi tidak cocok."] });
            return;
        }

        try {
            setSavingPw(true);
            await api.put("/profile/password", pw);
            setPw({ password_lama: "", password: "", password_confirmation: "" });
            showToast("Kata sandi berhasil diperbarui", "success");
        } catch (error) {
            console.error("Gagal mengganti kata sandi:", error);
            setPwErrors(error.response?.data?.errors || {});
            showToast(error.response?.data?.message || "Gagal mengganti kata sandi.", "error");
        } finally {
            setSavingPw(false);
        }
    };

    const err = (bag, f) => (bag[f] ? bag[f][0] : "");

    return (
        <div>
            <header className="admin-head">
                <div>
                    <span className="eyebrow">Konfigurasi</span>
                    <h1>Settings</h1>
                    <p>Kelola akun, keamanan, konfigurasi pembayaran, dan pencadangan database.</p>
                </div>
            </header>

            <div className="periode-tabs" role="tablist" aria-label="Bagian pengaturan">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        role="tab"
                        aria-selected={tab === t.id}
                        className={`filter-pill ${tab === t.id ? "active" : ""}`}
                        onClick={() => setTab(t.id)}
                    >
                        <i className={`bi ${t.icon}`} aria-hidden="true" style={{ marginRight: 6 }} />
                        {t.label}
                    </button>
                ))}
            </div>

            {loadError && tab !== "pembayaran" && tab !== "backup" ? (
                <EmptyState
                    tone="error"
                    title="Data belum termuat"
                    description={loadError}
                    action={
                        <button className="btn btn-primary" onClick={fetchProfil}>
                            Coba lagi
                        </button>
                    }
                />
            ) : (
                <>
                    {/* ── PROFIL ── */}
                    {tab === "profil" && (
                        <div className="panel" style={{ maxWidth: 640 }}>
                            <div className="panel-head">
                                <h3>
                                    <StickerInline name="pen" size={18} /> Profil admin
                                </h3>
                            </div>
                            <div className="panel-body">
                                {loading ? (
                                    <SkeletonBox height={220} radius="var(--radius-lg)" />
                                ) : (
                                    <form onSubmit={simpanProfil}>
                                        <div className="form-group">
                                            <label className="form-label" htmlFor="s-nama">Nama</label>
                                            <input
                                                id="s-nama"
                                                className={`form-control ${err(formErrors, "nama") ? "is-invalid" : ""}`}
                                                value={form.nama}
                                                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                                                disabled={savingProfil}
                                                required
                                            />
                                            {err(formErrors, "nama") && <p className="form-error">{err(formErrors, "nama")}</p>}
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label" htmlFor="s-email">Email</label>
                                            <input
                                                id="s-email"
                                                type="email"
                                                className={`form-control ${err(formErrors, "email") ? "is-invalid" : ""}`}
                                                value={form.email}
                                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                                disabled={savingProfil}
                                                required
                                            />
                                            {err(formErrors, "email") && <p className="form-error">{err(formErrors, "email")}</p>}
                                        </div>

                                        <div className="form-grid-2">
                                            <div className="form-group">
                                                <label className="form-label" htmlFor="s-telp">No. telepon</label>
                                                <input
                                                    id="s-telp"
                                                    className="form-control"
                                                    value={form.no_telepon}
                                                    onChange={(e) => setForm({ ...form, no_telepon: e.target.value })}
                                                    disabled={savingProfil}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label" htmlFor="s-role">Role</label>
                                                <input
                                                    id="s-role"
                                                    className="form-control"
                                                    value={profil?.role || ""}
                                                    disabled
                                                />
                                                <p className="form-hint">
                                                    Role tidak bisa diubah dari sini — backend menolaknya.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label" htmlFor="s-alamat">Alamat</label>
                                            <textarea
                                                id="s-alamat"
                                                rows="3"
                                                className="form-textarea"
                                                value={form.alamat}
                                                onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                                                disabled={savingProfil}
                                            />
                                        </div>

                                        <button type="submit" className="btn btn-primary" disabled={savingProfil}>
                                            {savingProfil && <span className="spin" />}
                                            {savingProfil ? "Menyimpan..." : "Simpan perubahan"}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── KEAMANAN ── */}
                    {tab === "keamanan" && (
                        <div className="panel" style={{ maxWidth: 640 }}>
                            <div className="panel-head">
                                <h3>
                                    <StickerInline name="heart" size={18} /> Ganti kata sandi
                                </h3>
                            </div>
                            <div className="panel-body">
                                <form onSubmit={gantiPassword}>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="s-pw-lama">Kata sandi lama</label>
                                        <input
                                            id="s-pw-lama"
                                            type="password"
                                            className={`form-control ${err(pwErrors, "password_lama") ? "is-invalid" : ""}`}
                                            value={pw.password_lama}
                                            onChange={(e) => setPw({ ...pw, password_lama: e.target.value })}
                                            disabled={savingPw}
                                            required
                                        />
                                        {err(pwErrors, "password_lama") && (
                                            <p className="form-error">{err(pwErrors, "password_lama")}</p>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" htmlFor="s-pw-baru">Kata sandi baru</label>
                                        <input
                                            id="s-pw-baru"
                                            type="password"
                                            className={`form-control ${err(pwErrors, "password") ? "is-invalid" : ""}`}
                                            value={pw.password}
                                            onChange={(e) => setPw({ ...pw, password: e.target.value })}
                                            disabled={savingPw}
                                            required
                                        />
                                        <p className="form-hint">Minimal 6 karakter.</p>
                                        {err(pwErrors, "password") && <p className="form-error">{err(pwErrors, "password")}</p>}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" htmlFor="s-pw-ulang">Ulangi kata sandi baru</label>
                                        <input
                                            id="s-pw-ulang"
                                            type="password"
                                            className={`form-control ${err(pwErrors, "password_confirmation") ? "is-invalid" : ""}`}
                                            value={pw.password_confirmation}
                                            onChange={(e) => setPw({ ...pw, password_confirmation: e.target.value })}
                                            disabled={savingPw}
                                            required
                                        />
                                        {err(pwErrors, "password_confirmation") && (
                                            <p className="form-error">{err(pwErrors, "password_confirmation")}</p>
                                        )}
                                    </div>

                                    <div className="note-card" style={{ marginBottom: 18 }}>
                                        Setelah kata sandi diganti, sesi lain yang masih terbuka akan
                                        dikeluarkan otomatis. Sesi di perangkat ini tetap aktif.
                                    </div>

                                    <button type="submit" className="btn btn-primary" disabled={savingPw}>
                                        {savingPw && <span className="spin" />}
                                        {savingPw ? "Menyimpan..." : "Simpan kata sandi"}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* ── PEMBAYARAN ── */}
                    {tab === "pembayaran" && (
                        <div className="panel" style={{ maxWidth: 760 }}>
                            <div className="panel-head">
                                <h3>
                                    <StickerInline name="sparkle" size={18} /> Tujuan pembayaran
                                </h3>
                            </div>
                            <div className="panel-body">
                                {usingDemoAccounts() && (
                                    <div
                                        className="note-card"
                                        style={{ marginBottom: 16, background: "var(--warning-bg)", borderColor: "transparent" }}
                                    >
                                        <strong style={{ display: "block", marginBottom: 4 }}>
                                            Masih memakai data DEMO
                                        </strong>
                                        Nomor di bawah adalah placeholder untuk keperluan demo, bukan rekening
                                        asli. Ganti isi <code>src/config/payment.js</code> sebelum menerima
                                        pembayaran sungguhan.
                                    </div>
                                )}

                                <div className="note-card" style={{ marginBottom: 20 }}>
                                    Data ini dibaca dari <code>src/config/payment.js</code>, bukan dari
                                    database. Karena itu halaman ini hanya menampilkannya — tidak ada
                                    tombol simpan, sebab tidak ada tempat menyimpannya di backend. Untuk
                                    mengubahnya, edit file tersebut lalu build ulang frontend.
                                </div>

                                <h4 style={{ marginBottom: 12 }}>Rekening bank</h4>
                                {BANK_ACCOUNTS.length === 0 ? (
                                    <p className="state-inline">
                                        Belum diisi. Customer yang memilih Transfer Bank akan melihat
                                        peringatan, bukan nomor rekening.
                                    </p>
                                ) : (
                                    BANK_ACCOUNTS.map((b) => (
                                        <div className="option-card" key={b.bank + b.nomor} style={{ cursor: "default", marginBottom: 10 }}>
                                            <div>
                                                <span className="option-card-title">{b.bank}</span>
                                                <span className="option-card-desc">
                                                    {b.nomor} — a.n. {b.atasNama}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}

                                <h4 style={{ margin: "24px 0 12px" }}>E-Wallet</h4>
                                {EWALLET_ACCOUNTS.length === 0 ? (
                                    <p className="state-inline">
                                        Belum diisi. Customer yang memilih E-Wallet akan melihat peringatan.
                                    </p>
                                ) : (
                                    EWALLET_ACCOUNTS.map((w) => (
                                        <div className="option-card" key={w.provider + w.nomor} style={{ cursor: "default", marginBottom: 10 }}>
                                            <div>
                                                <span className="option-card-title">{w.provider}</span>
                                                <span className="option-card-desc">
                                                    {w.nomor} — a.n. {w.atasNama}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── BACKUP ── */}
                    {tab === "backup" && (
                        <div className="panel" style={{ maxWidth: 640 }}>
                            <div className="panel-head">
                                <h3>
                                    <StickerInline name="tape" size={18} /> Backup &amp; Restore
                                </h3>
                            </div>
                            <div className="panel-body">
                                <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>
                                    Pencadangan dan pemulihan database dikelola di halaman tersendiri,
                                    lengkap dengan riwayat backup dan konfirmasi restore.
                                </p>
                                <button className="btn btn-primary" onClick={() => navigate("/backup")}>
                                    Buka Backup Database
                                    <i className="bi bi-arrow-right" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
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

export default SettingsPage;
