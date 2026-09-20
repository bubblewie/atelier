import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import Toast from "../components/ui/Toast";
import Sticker, { StickerInline } from "../components/common/Sticker";
import { editorialArt } from "../components/common/media";
import "./AuthPages.css";

const POINTS = [
    "Riwayat pesanan tersimpan rapi",
    "Lacak status pengiriman",
    "Checkout lebih cepat",
];

function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const redirectMessage = location.state?.message;
    const redirectTo = location.state?.from;

    const [form, setForm] = useState({ email: "", password: "" });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [toast, setToast] = useState({ message: "", type: "error" });

    const showToast = (message, type = "error") => {
        setToast({ message, type });
        window.setTimeout(() => setToast({ message: "", type }), 3600);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const validate = () => {
        const next = {};
        if (!form.email.trim()) next.email = "Email wajib diisi.";
        else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = "Format email belum benar.";
        if (!form.password) next.password = "Password wajib diisi.";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            setLoading(true);
            const response = await api.post("/login", {
                email: form.email,
                password: form.password,
            });

            const token = response.data?.token;
            const user = response.data?.data;

            if (!token || !user) {
                showToast("Respons login tidak lengkap. Hubungi admin.", "error");
                return;
            }

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
            window.dispatchEvent(new Event("storage"));

            if (user.role === "admin") navigate("/dashboard", { replace: true });
            else navigate(redirectTo || "/customer/dashboard", { replace: true });
        } catch (error) {
            console.error("Login error:", error);
            const status = error.response?.status;

            if (status === 401) {
                showToast("Email atau password salah.", "error");
            } else if (status === 422 && error.response?.data?.errors) {
                showToast(Object.values(error.response.data.errors).flat().join(" · "), "error");
            } else {
                showToast(error.response?.data?.message || "Gagal masuk. Coba lagi sebentar.", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-shell">
            {/* ── visual panel ── */}
            <aside className="auth-visual">
                <Sticker name="ring" size={120} rotate={-12} float style={{ top: 60, right: -30, opacity: 0.4 }} />
                <Sticker name="star" size={40} rotate={16} float style={{ bottom: 140, right: 70 }} />
                <Sticker name="bow" size={48} rotate={-10} style={{ top: 180, left: -14 }} />

                <button type="button" className="auth-brand" onClick={() => navigate("/")}>
                    Atelier<span className="brand-mark">®</span>
                </button>

                <div className="auth-visual-body">
                    <span className="eyebrow">Selamat datang kembali</span>
                    <h2 className="display-l">Lanjutkan dari terakhir kali.</h2>
                    <p>
                        Masuk untuk melihat riwayat pesanan, melacak pengiriman, dan menyelesaikan
                        checkout lebih cepat.
                    </p>

                    <figure className="frame-photo tilt-l auth-photo">
                        <img src={editorialArt("login", { width: 840, height: 480, label: "ATELIER STUDIO" })} alt="" />
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

            {/* ── form panel ── */}
            <main className="auth-form-panel">
                <div className="auth-card">
                    <header className="auth-head">
                        <span className="eyebrow">Masuk</span>
                        <h1>Halo lagi.</h1>
                        <p>Gunakan email dan password akun Atelier kamu.</p>
                    </header>

                    {redirectMessage && (
                        <div className="auth-notice">
                            <i className="bi bi-info-circle-fill" aria-hidden="true" />
                            <span>{redirectMessage}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="form-group">
                            <label className="form-label" htmlFor="login-email">
                                Email
                            </label>
                            <input
                                id="login-email"
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
                            <label className="form-label" htmlFor="login-password">
                                Password
                            </label>
                            <div className="input-wrap">
                                <input
                                    id="login-password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    className={`form-control ${errors.password ? "is-invalid" : ""}`}
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
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

                        <div className="auth-row">
                            <button
                                type="button"
                                className="auth-link"
                                onClick={() => showToast("Fitur lupa password belum tersedia.", "info")}
                            >
                                Lupa password?
                            </button>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
                            {loading && <span className="spin" />}
                            {loading ? "Sedang masuk…" : "Masuk"}
                        </button>
                    </form>

                    <div className="auth-foot">
                        Belum punya akun?
                        <Link to="/register" className="auth-link">
                            Buat akun
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

export default LoginPage;
