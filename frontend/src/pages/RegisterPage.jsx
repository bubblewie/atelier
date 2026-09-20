import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import Toast from "../components/ui/Toast";
import Sticker, { StickerInline } from "../components/common/Sticker";
import { editorialArt } from "../components/common/media";
import "./AuthPages.css";

const POINTS = ["Gratis, tanpa biaya", "Simpan alamat pengiriman", "Riwayat pesanan lengkap"];

function RegisterPage() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        nama: "",
        email: "",
        no_telepon: "",
        alamat: "",
        password: "",
        password_confirmation: "",
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [toast, setToast] = useState({ message: "", type: "error" });

    const showToast = (message, type = "error") => {
        setToast({ message, type });
        window.setTimeout(() => setToast({ message: "", type }), 3800);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const validate = () => {
        const next = {};
        if (!form.nama.trim()) next.nama = "Nama lengkap wajib diisi.";
        if (!form.email.trim()) next.email = "Email wajib diisi.";
        else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = "Format email belum benar.";
        if (!form.password) next.password = "Password wajib diisi.";
        else if (form.password.length < 8) next.password = "Password minimal 8 karakter.";
        if (form.password !== form.password_confirmation)
            next.password_confirmation = "Konfirmasi password belum cocok.";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            setLoading(true);

            // Field names match the existing /register endpoint exactly.
            await api.post("/register", {
                nama: form.nama,
                email: form.email,
                password: form.password,
                password_confirmation: form.password_confirmation,
                no_telepon: form.no_telepon || null,
                alamat: form.alamat || null,
            });

            showToast("Akun berhasil dibuat! Mengarahkan ke halaman masuk…", "success");
            window.setTimeout(() => navigate("/login"), 1400);
        } catch (error) {
            console.error("Register error:", error);
            const apiErrors = error.response?.data?.errors;

            if (error.response?.status === 422 && apiErrors) {
                // Surface field-level messages next to the inputs they belong to.
                const mapped = {};
                Object.entries(apiErrors).forEach(([key, value]) => {
                    mapped[key] = Array.isArray(value) ? value[0] : String(value);
                });
                setErrors(mapped);
                showToast("Periksa kembali data yang kamu isi.", "error");
                return;
            }

            showToast(error.response?.data?.message || "Gagal mendaftar. Coba lagi sebentar.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-shell">
            <aside className="auth-visual">
                <Sticker name="ring" size={118} rotate={10} float style={{ top: 90, left: -34, opacity: 0.4 }} />
                <Sticker name="flower" size={46} rotate={-12} float style={{ bottom: 160, right: 62 }} />
                <Sticker name="heart" size={38} rotate={14} style={{ top: 150, right: 40 }} />

                <button type="button" className="auth-brand" onClick={() => navigate("/")}>
                    Atelier<span className="brand-mark">®</span>
                </button>

                <div className="auth-visual-body">
                    <span className="eyebrow">Atelier Club</span>
                    <h2 className="display-l">Mulai catatan barumu.</h2>
                    <p>
                        Satu akun untuk menyimpan pesanan, alamat pengiriman, dan mempercepat
                        checkout berikutnya.
                    </p>

                    <figure className="frame-photo tilt-r auth-photo">
                        <img src={editorialArt("register", { width: 840, height: 480, label: "ATELIER CLUB" })} alt="" />
                    </figure>
                </div>

                <ul className="auth-points">
                    {POINTS.map((p) => (
                        <li key={p}>
                            <StickerInline name="sparkle" size={17} />
                            {p}
                        </li>
                    ))}
                </ul>
            </aside>

            <main className="auth-form-panel">
                <div className="auth-card wide">
                    <header className="auth-head">
                        <span className="eyebrow">Daftar</span>
                        <h1>Buat akun Atelier.</h1>
                        <p>Hanya butuh satu menit.</p>
                    </header>

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="form-group">
                            <label className="form-label" htmlFor="reg-nama">
                                Nama lengkap
                            </label>
                            <input
                                id="reg-nama"
                                type="text"
                                name="nama"
                                className={`form-control ${errors.nama ? "is-invalid" : ""}`}
                                value={form.nama}
                                onChange={handleChange}
                                placeholder="Nama sesuai penerima paket"
                                autoComplete="name"
                                disabled={loading}
                                aria-invalid={Boolean(errors.nama)}
                            />
                            {errors.nama && <p className="form-error">{errors.nama}</p>}
                        </div>

                        <div className="form-grid-2">
                            <div className="form-group">
                                <label className="form-label" htmlFor="reg-email">
                                    Email
                                </label>
                                <input
                                    id="reg-email"
                                    type="email"
                                    name="email"
                                    className={`form-control ${errors.email ? "is-invalid" : ""}`}
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="nama@email.com"
                                    autoComplete="email"
                                    disabled={loading}
                                    aria-invalid={Boolean(errors.email)}
                                />
                                {errors.email && <p className="form-error">{errors.email}</p>}
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="reg-telp">
                                    Nomor telepon
                                </label>
                                <input
                                    id="reg-telp"
                                    type="tel"
                                    name="no_telepon"
                                    className={`form-control ${errors.no_telepon ? "is-invalid" : ""}`}
                                    value={form.no_telepon}
                                    onChange={handleChange}
                                    placeholder="08123456789"
                                    autoComplete="tel"
                                    disabled={loading}
                                />
                                {errors.no_telepon ? (
                                    <p className="form-error">{errors.no_telepon}</p>
                                ) : (
                                    <p className="form-hint">Opsional</p>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="reg-alamat">
                                Alamat pengiriman
                            </label>
                            <textarea
                                id="reg-alamat"
                                name="alamat"
                                className={`form-textarea ${errors.alamat ? "is-invalid" : ""}`}
                                rows="2"
                                value={form.alamat}
                                onChange={handleChange}
                                placeholder="Jalan, nomor, kota, kode pos"
                                disabled={loading}
                            />
                            {errors.alamat ? (
                                <p className="form-error">{errors.alamat}</p>
                            ) : (
                                <p className="form-hint">Opsional — bisa dilengkapi nanti</p>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="reg-password">
                                Password
                            </label>
                            <div className="input-wrap">
                                <input
                                    id="reg-password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    className={`form-control ${errors.password ? "is-invalid" : ""}`}
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Minimal 8 karakter"
                                    autoComplete="new-password"
                                    disabled={loading}
                                    aria-invalid={Boolean(errors.password)}
                                />
                                <button
                                    type="button"
                                    className="pw-toggle"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                                >
                                    <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} aria-hidden="true" />
                                </button>
                            </div>
                            {errors.password && <p className="form-error">{errors.password}</p>}
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="reg-password2">
                                Ulangi password
                            </label>
                            <input
                                id="reg-password2"
                                type={showPassword ? "text" : "password"}
                                name="password_confirmation"
                                className={`form-control ${errors.password_confirmation ? "is-invalid" : ""}`}
                                value={form.password_confirmation}
                                onChange={handleChange}
                                placeholder="Ketik ulang password"
                                autoComplete="new-password"
                                disabled={loading}
                                aria-invalid={Boolean(errors.password_confirmation)}
                            />
                            {errors.password_confirmation && (
                                <p className="form-error">{errors.password_confirmation}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg btn-block"
                            disabled={loading}
                            style={{ marginTop: 6 }}
                        >
                            {loading && <span className="spin" />}
                            {loading ? "Membuat akun…" : "Buat akun"}
                        </button>
                    </form>

                    <div className="auth-foot">
                        Sudah punya akun?
                        <Link to="/login" className="auth-link">
                            Masuk
                        </Link>
                    </div>

                    <button type="button" className="auth-back" onClick={() => navigate("/")}>
                        <i className="bi bi-arrow-left" aria-hidden="true" />
                        Kembali ke beranda
                    </button>
                </div>
            </main>

            <div className="toast-container">
                <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "error" })} />
            </div>
        </div>
    );
}

export default RegisterPage;
