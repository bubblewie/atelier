import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import Toast from "../components/ui/Toast";
import EmptyState from "../components/common/EmptyState";
import { SkeletonBox } from "../components/ui/Skeleton";
import { StickerInline } from "../components/common/Sticker";
import "./AdminPages.css";

function KategoriEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [nama, setNama] = useState("");
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState({ message: "", type: "error" });

    const showToast = (message, type = "error") => {
        setToast({ message, type });
        window.setTimeout(() => setToast({ message: "", type }), 3600);
    };

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setNotFound(false);

            const response = await api.get(`/kategori/${id}`);
            const kategori = response.data?.data;

            if (!kategori) {
                setNotFound(true);
                return;
            }

            setNama(kategori.nama_kategori || kategori.nama_Kategori || "");
        } catch (error) {
            console.error("Gagal mengambil kategori:", error);
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!nama.trim()) {
            setErrors({ nama_kategori: "Nama kategori wajib diisi." });
            return;
        }

        try {
            setSaving(true);
            setErrors({});

            await api.put(`/kategori/${id}`, { nama_kategori: nama.trim() });

            showToast("Kategori berhasil diperbarui.", "success");
            window.setTimeout(() => navigate("/kategori"), 1000);
        } catch (error) {
            console.error("Gagal memperbarui kategori:", error);
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

            showToast(error.response?.data?.message || "Perubahan gagal disimpan.", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="stack gap-20" style={{ maxWidth: 560 }}>
                <SkeletonBox width="40%" height={30} />
                <SkeletonBox height={230} radius="var(--radius-xl)" />
            </div>
        );
    }

    if (notFound) {
        return (
            <EmptyState
                tone="error"
                title="Kategori tidak ditemukan"
                description="Kategori ini mungkin sudah dihapus atau ID-nya tidak valid."
                action={
                    <button className="btn btn-primary" onClick={() => navigate("/kategori")}>
                        Kembali ke daftar kategori
                    </button>
                }
            />
        );
    }

    return (
        <div>
            <header className="admin-head">
                <div>
                    <button className="back-link" onClick={() => navigate("/kategori")} type="button">
                        <i className="bi bi-arrow-left" aria-hidden="true" />
                        Kembali ke kategori
                    </button>
                    <h1>Ubah kategori</h1>
                    <p>Perbarui nama kategori ini.</p>
                </div>
            </header>

            <div className="panel admin-form-card" style={{ maxWidth: 560 }}>
                <form onSubmit={handleSubmit} className="panel-body" noValidate>
                    <div className="field-set">
                        <div className="field-set-title">
                            <StickerInline name="flower" size={20} /> Detail kategori
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" htmlFor="ke-nama">
                                Nama kategori *
                            </label>
                            <input
                                id="ke-nama"
                                type="text"
                                className={`form-control ${errors.nama_kategori ? "is-invalid" : ""}`}
                                value={nama}
                                onChange={(e) => {
                                    setNama(e.target.value);
                                    setErrors({});
                                }}
                                disabled={saving}
                                autoFocus
                            />
                            {errors.nama_kategori && <p className="form-error">{errors.nama_kategori}</p>}
                        </div>
                    </div>

                    <div className="admin-form-actions">
                        <button type="button" className="btn btn-outline" onClick={() => navigate("/kategori")} disabled={saving}>
                            Batal
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving && <span className="spin" />}
                            {saving ? "Menyimpan…" : "Simpan perubahan"}
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

export default KategoriEditPage;
