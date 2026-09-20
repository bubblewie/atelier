import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Toast from "../components/ui/Toast";
import { StickerInline } from "../components/common/Sticker";
import "./AdminPages.css";

function KategoriCreatePage() {
    const navigate = useNavigate();

    const [nama, setNama] = useState("");
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ message: "", type: "error" });

    const showToast = (message, type = "error") => {
        setToast({ message, type });
        window.setTimeout(() => setToast({ message: "", type }), 3600);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!nama.trim()) {
            setErrors({ nama_kategori: "Nama kategori wajib diisi." });
            return;
        }

        try {
            setLoading(true);
            setErrors({});

            await api.post("/kategori", { nama_kategori: nama.trim() });

            showToast("Kategori berhasil ditambahkan.", "success");
            window.setTimeout(() => navigate("/kategori"), 1000);
        } catch (error) {
            console.error("Gagal menambahkan kategori:", error);
            const apiErrors = error.response?.data?.errors;

            if (error.response?.status === 422 && apiErrors) {
                const mapped = {};
                Object.entries(apiErrors).forEach(([key, value]) => {
                    mapped[key] = Array.isArray(value) ? value[0] : String(value);
                });
                setErrors(mapped);
                showToast("Periksa kembali data yang kamu isi.", "error");
                return;
            }

            showToast(error.response?.data?.message || "Kategori gagal disimpan.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <header className="admin-head">
                <div>
                    <button className="back-link" onClick={() => navigate("/kategori")} type="button">
                        <i className="bi bi-arrow-left" aria-hidden="true" />
                        Kembali ke kategori
                    </button>
                    <h1>Tambah kategori</h1>
                    <p>Buat kelompok baru untuk mengatur katalog.</p>
                </div>
            </header>

            <div className="panel admin-form-card" style={{ maxWidth: 560 }}>
                <form onSubmit={handleSubmit} className="panel-body" noValidate>
                    <div className="field-set">
                        <div className="field-set-title">
                            <StickerInline name="flower" size={20} /> Detail kategori
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" htmlFor="kc-nama">
                                Nama kategori *
                            </label>
                            <input
                                id="kc-nama"
                                type="text"
                                className={`form-control ${errors.nama_kategori ? "is-invalid" : ""}`}
                                value={nama}
                                onChange={(e) => {
                                    setNama(e.target.value);
                                    setErrors({});
                                }}
                                placeholder="Contoh: Notebooks"
                                disabled={loading}
                                autoFocus
                            />
                            {errors.nama_kategori ? (
                                <p className="form-error">{errors.nama_kategori}</p>
                            ) : (
                                <p className="form-hint">Gunakan nama singkat dan jelas.</p>
                            )}
                        </div>
                    </div>

                    <div className="admin-form-actions">
                        <button type="button" className="btn btn-outline" onClick={() => navigate("/kategori")} disabled={loading}>
                            Batal
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading && <span className="spin" />}
                            {loading ? "Menyimpan…" : "Simpan kategori"}
                        </button>
                    </div>
                </form>
            </div>

            <div className="toast-container">
                <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "error" })} />
            </div>
        </div>
    );
}

export default KategoriCreatePage;
