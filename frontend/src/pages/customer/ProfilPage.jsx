import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import CustomerNavbar from "../../components/CustomerNavbar";
import CustomerFooter from "../../components/CustomerFooter";
import EmptyState from "../../components/common/EmptyState";
import Toast from "../../components/ui/Toast";
import Sticker, { StickerInline } from "../../components/common/Sticker";
import { SkeletonBox } from "../../components/ui/Skeleton";
import "../CustomerPages.css";

/**
 * Customer → Profil.
 *
 * Identitas SELALU diambil dari `GET /profile`, yang backend resolusikan dari
 * token Sanctum — bukan dari ID di URL dan bukan dari localStorage. Jadi tidak
 * ada cara mengedit akun orang lain lewat halaman ini.
 *
 * Field yang ditampilkan mengikuti kolom yang benar-benar ada di tabel `users`:
 * nama, email, no_telepon, alamat. Kolom `role` sengaja tidak pernah dikirim —
 * backend juga tidak menerimanya, supaya customer tidak bisa menaikkan dirinya
 * sendiri jadi admin.
 */
const ProfilPage = () => {
    const navigate = useNavigate();

    const [profil, setProfil] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ nama: "", email: "", no_telepon: "", alamat: "" });
    const [formErrors, setFormErrors] = useState({});
    const [savingProfil, setSavingProfil] = useState(false);

    const [pw, setPw] = useState({ password_lama: "", password: "", password_confirmation: "" });
    const [pwErrors, setPwErrors] = useState({});
    const [savingPw, setSavingPw] = useState(false);
    const [showPwForm, setShowPwForm] = useState(false);

    const [toast, setToast] = useState({ message: "", type: "success" });

    const showToast = useCallback((message, type = "success") => {
        setToast({ message, type });
        window.setTimeout(() => setToast({ message: "", type }), 3600);
    }, []);

    const isiForm = (data) =>
        setForm({
            nama: data?.nama || data?.name || "",
            email: data?.email || "",
            no_telepon: data?.no_telepon || "",
            alamat: data?.alamat || "",
        });

    const fetchProfil = useCallback(async () => {
        try {
            setLoading(true);
            setLoadError("");
            const response = await api.get("/profile");
            const data = response.data?.data || null;
            setProfil(data);
            isiForm(data);
        } catch (error) {
            console.error("Gagal mengambil profil:", error);
            if (error.response?.status === 401) {
                navigate("/login", { state: { from: "/customer/profil" } });
                return;
            }
            setLoadError("Profil belum bisa dimuat. Periksa koneksi ke server lalu coba lagi.");
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchProfil();
    }, [fetchProfil]);

    /* ------------------------------------------------------ simpan profil */
    const simpanProfil = async (e) => {
        e.preventDefault();
        setFormErrors({});

        if (!form.nama.trim()) {
            setFormErrors({ nama: ["Nama tidak boleh kosong."] });
            return;
        }

        try {
            setSavingProfil(true);

            const response = await api.put("/profile", {
                nama: form.nama.trim(),
                email: form.email.trim(),
                no_telepon: form.no_telepon.trim() || null,
                alamat: form.alamat.trim() || null,
            });

            const data = response.data?.data || null;
            setProfil(data);
            isiForm(data);

            // Segarkan sesi lokal agar sapaan di navbar & dashboard ikut berubah
            // tanpa perlu logout. Token tidak disentuh.
            try {
                const sesi = JSON.parse(localStorage.getItem("user") || "null");
                if (sesi && data) {
                    localStorage.setItem("user", JSON.stringify({ ...sesi, ...data }));
                }
            } catch {
                // Sesi rusak bukan alasan menggagalkan simpan yang sudah sukses.
            }

            setEditing(false);
            showToast("Profil berhasil diperbarui", "success");
        } catch (error) {
            console.error("Gagal menyimpan profil:", error);

            if (error.response?.status === 401) {
                navigate("/login", { state: { from: "/customer/profil" } });
                return;
            }

            // Form TIDAK direset — isian yang sudah diketik tetap ada.
            setFormErrors(error.response?.data?.errors || {});
            showToast(
                error.response?.data?.message || "Gagal menyimpan profil. Isianmu masih tersimpan.",
                "error"
            );
        } finally {
            setSavingProfil(false);
        }
    };

    const batalEdit = () => {
        isiForm(profil);
        setFormErrors({});
        setEditing(false);
    };

    /* ------------------------------------------------------ ganti sandi */
    const gantiPassword = async (e) => {
        e.preventDefault();
        setPwErrors({});

        if (pw.password !== pw.password_confirmation) {
            setPwErrors({ password_confirmation: ["Konfirmasi kata sandi tidak cocok."] });
            return;
        }
        if (pw.password.length < 6) {
            setPwErrors({ password: ["Kata sandi baru minimal 6 karakter."] });
            return;
        }

        try {
            setSavingPw(true);
            await api.put("/profile/password", pw);

            setPw({ password_lama: "", password: "", password_confirmation: "" });
            setShowPwForm(false);
            showToast("Kata sandi berhasil diperbarui", "success");
        } catch (error) {
            console.error("Gagal mengganti kata sandi:", error);
            setPwErrors(error.response?.data?.errors || {});
            showToast(
                error.response?.data?.message || "Gagal mengganti kata sandi.",
                "error"
            );
        } finally {
            setSavingPw(false);
        }
    };

    const err = (bag, field) => (bag[field] ? bag[field][0] : "");

    /* ------------------------------------------------------------ render */
    return (
        <div className="customer-page-wrapper">
            <CustomerNavbar />

            <main className="page-main">
                <div className="atelier-container">
                    <header className="page-head">
                        <Sticker name="flower" size={34} rotate={-12} float style={{ top: 30, right: "8%" }} />
                        <span className="eyebrow">Akun</span>
                        <h1>Profil saya</h1>
                        <p>Kelola data akunmu. Perubahan langsung berlaku tanpa perlu keluar dan masuk lagi.</p>
                    </header>

                    {loading ? (
                        <>
                            <SkeletonBox height={120} radius="var(--radius-xl)" />
                            <div style={{ height: 20 }} />
                            <SkeletonBox height={300} radius="var(--radius-xl)" />
                        </>
                    ) : loadError ? (
                        <EmptyState
                            tone="error"
                            title="Profil belum termuat"
                            description={loadError}
                            action={
                                <button className="btn btn-primary" onClick={fetchProfil}>
                                    Coba lagi
                                </button>
                            }
                        />
                    ) : (
                        <div className="cart-layout">
                            <div>
                                {/* ── Data profil ── */}
                                <div className="panel" style={{ marginBottom: 24 }}>
                                    <div className="panel-head">
                                        <h3>
                                            <StickerInline name="pen" size={18} /> Data akun
                                        </h3>
                                        {!editing && (
                                            <button
                                                type="button"
                                                className="btn btn-mint btn-sm"
                                                onClick={() => setEditing(true)}
                                            >
                                                <i className="bi bi-pencil" aria-hidden="true" />
                                                Edit profil
                                            </button>
                                        )}
                                    </div>

                                    <div className="panel-body">
                                        {!editing ? (
                                            <>
                                                <div className="summary-line">
                                                    <span>Nama</span>
                                                    <span>{profil?.nama || profil?.name || "—"}</span>
                                                </div>
                                                <div className="summary-line">
                                                    <span>Email</span>
                                                    <span>{profil?.email || "—"}</span>
                                                </div>
                                                <div className="summary-line">
                                                    <span>No. telepon</span>
                                                    <span>{profil?.no_telepon || "—"}</span>
                                                </div>
                                                <div className="summary-line" style={{ alignItems: "flex-start" }}>
                                                    <span>Alamat</span>
                                                    <span style={{ textAlign: "right", maxWidth: 320 }}>
                                                        {profil?.alamat || "—"}
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <form onSubmit={simpanProfil}>
                                                <div className="form-group">
                                                    <label className="form-label" htmlFor="nama">Nama lengkap</label>
                                                    <input
                                                        id="nama"
                                                        className={`form-control ${err(formErrors, "nama") ? "is-invalid" : ""}`}
                                                        value={form.nama}
                                                        onChange={(e) => setForm({ ...form, nama: e.target.value })}
                                                        disabled={savingProfil}
                                                        required
                                                    />
                                                    {err(formErrors, "nama") && (
                                                        <p className="form-error">{err(formErrors, "nama")}</p>
                                                    )}
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label" htmlFor="email">Email</label>
                                                    <input
                                                        id="email"
                                                        type="email"
                                                        className={`form-control ${err(formErrors, "email") ? "is-invalid" : ""}`}
                                                        value={form.email}
                                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                                        disabled={savingProfil}
                                                        required
                                                    />
                                                    {err(formErrors, "email") && (
                                                        <p className="form-error">{err(formErrors, "email")}</p>
                                                    )}
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label" htmlFor="no_telepon">No. telepon</label>
                                                    <input
                                                        id="no_telepon"
                                                        className={`form-control ${err(formErrors, "no_telepon") ? "is-invalid" : ""}`}
                                                        value={form.no_telepon}
                                                        onChange={(e) => setForm({ ...form, no_telepon: e.target.value })}
                                                        disabled={savingProfil}
                                                        placeholder="08xxxxxxxxxx"
                                                    />
                                                    {err(formErrors, "no_telepon") && (
                                                        <p className="form-error">{err(formErrors, "no_telepon")}</p>
                                                    )}
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label" htmlFor="alamat">Alamat</label>
                                                    <textarea
                                                        id="alamat"
                                                        rows="3"
                                                        className="form-textarea"
                                                        value={form.alamat}
                                                        onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                                                        disabled={savingProfil}
                                                    />
                                                </div>

                                                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                                    <button type="submit" className="btn btn-primary" disabled={savingProfil}>
                                                        {savingProfil && <span className="spin" />}
                                                        {savingProfil ? "Menyimpan..." : "Simpan perubahan"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-ghost"
                                                        onClick={batalEdit}
                                                        disabled={savingProfil}
                                                    >
                                                        Batal
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                </div>

                                {/* ── Kata sandi ── */}
                                <div className="panel">
                                    <div className="panel-head">
                                        <h3>
                                            <StickerInline name="heart" size={18} /> Kata sandi
                                        </h3>
                                        {!showPwForm && (
                                            <button
                                                type="button"
                                                className="btn btn-outline btn-sm"
                                                onClick={() => setShowPwForm(true)}
                                            >
                                                Ganti kata sandi
                                            </button>
                                        )}
                                    </div>

                                    <div className="panel-body">
                                        {!showPwForm ? (
                                            <p style={{ color: "var(--text-muted)", fontSize: 14.5 }}>
                                                Demi keamanan, kata sandi tidak pernah ditampilkan. Kamu perlu
                                                memasukkan kata sandi lama untuk menggantinya.
                                            </p>
                                        ) : (
                                            <form onSubmit={gantiPassword}>
                                                <div className="form-group">
                                                    <label className="form-label" htmlFor="password_lama">Kata sandi lama</label>
                                                    <input
                                                        id="password_lama"
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
                                                    <label className="form-label" htmlFor="password">Kata sandi baru</label>
                                                    <input
                                                        id="password"
                                                        type="password"
                                                        className={`form-control ${err(pwErrors, "password") ? "is-invalid" : ""}`}
                                                        value={pw.password}
                                                        onChange={(e) => setPw({ ...pw, password: e.target.value })}
                                                        disabled={savingPw}
                                                        required
                                                    />
                                                    <p className="form-hint">Minimal 6 karakter.</p>
                                                    {err(pwErrors, "password") && (
                                                        <p className="form-error">{err(pwErrors, "password")}</p>
                                                    )}
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label" htmlFor="password_confirmation">
                                                        Ulangi kata sandi baru
                                                    </label>
                                                    <input
                                                        id="password_confirmation"
                                                        type="password"
                                                        className={`form-control ${err(pwErrors, "password_confirmation") ? "is-invalid" : ""}`}
                                                        value={pw.password_confirmation}
                                                        onChange={(e) =>
                                                            setPw({ ...pw, password_confirmation: e.target.value })
                                                        }
                                                        disabled={savingPw}
                                                        required
                                                    />
                                                    {err(pwErrors, "password_confirmation") && (
                                                        <p className="form-error">
                                                            {err(pwErrors, "password_confirmation")}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="note-card" style={{ marginBottom: 18 }}>
                                                    Setelah kata sandi diganti, sesi lain yang masih terbuka akan
                                                    dikeluarkan otomatis. Sesi di perangkat ini tetap aktif.
                                                </div>

                                                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                                    <button type="submit" className="btn btn-primary" disabled={savingPw}>
                                                        {savingPw && <span className="spin" />}
                                                        {savingPw ? "Menyimpan..." : "Simpan kata sandi"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-ghost"
                                                        onClick={() => {
                                                            setShowPwForm(false);
                                                            setPwErrors({});
                                                            setPw({
                                                                password_lama: "",
                                                                password: "",
                                                                password_confirmation: "",
                                                            });
                                                        }}
                                                        disabled={savingPw}
                                                    >
                                                        Batal
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ── Sisi kanan ── */}
                            <aside className="summary-card">
                                <h3>Pintasan</h3>
                                <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 18 }}>
                                    Masuk sebagai{" "}
                                    <strong>{profil?.nama || profil?.name || "pengguna"}</strong>.
                                </p>

                                <button
                                    className="btn btn-outline btn-block"
                                    style={{ marginBottom: 10 }}
                                    onClick={() => navigate("/customer/dashboard")}
                                >
                                    Dashboard saya
                                </button>
                                <button
                                    className="btn btn-outline btn-block"
                                    style={{ marginBottom: 10 }}
                                    onClick={() => navigate("/customer/pesanan-saya")}
                                >
                                    Pesanan saya
                                </button>
                                <button className="btn btn-ghost btn-block" onClick={() => navigate("/customer/produk")}>
                                    Lanjut belanja
                                </button>
                            </aside>
                        </div>
                    )}
                </div>
            </main>

            <CustomerFooter />

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

export default ProfilPage;
