import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import Toast from "../../components/ui/Toast";
import { SkeletonBox } from "../../components/ui/Skeleton";
import EmptyState from "../../components/common/EmptyState";
import { StickerInline } from "../../components/common/Sticker";
import { storageUrl, placeholderImage } from "../../components/common/media";
import "../AdminPages.css";


const ProdukEditPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [kategori, setKategori] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [fotoLama, setFotoLama] = useState(null);
    const [preview, setPreview] = useState(null);
    const [toast, setToast] = useState({ message: "", type: "error" });

    const [form, setForm] = useState({
        id_kategori: "",
        nama_produk: "",
        harga: "",
        stok: "",
        deskripsi: "",
        foto_produk: null,
    });

    const showToast = (message, type = "error") => {
        setToast({ message, type });
        window.setTimeout(() => setToast({ message: "", type }), 3600);
    };

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setNotFound(false);

            const [kategoriRes, produkRes] = await Promise.all([
                api.get(`/kategori`),
                api.get(`/produk/${id}`),
            ]);

            setKategori(kategoriRes.data?.data || []);

            const produk = produkRes.data?.data;
            if (!produk) {
                setNotFound(true);
                return;
            }

            setForm({
                id_kategori: produk.id_kategori ?? "",
                nama_produk: produk.nama_produk ?? "",
                harga: produk.harga ?? "",
                stok: produk.stok ?? "",
                deskripsi: produk.deskripsi ?? "",
                foto_produk: null,
            });
            setFotoLama(produk.foto_produk || null);
        } catch (error) {
            console.error("Gagal mengambil produk:", error);
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handleFile = (e) => {
        const file = e.target.files?.[0] || null;
        setForm((prev) => ({ ...prev, foto_produk: file }));
        if (preview) URL.revokeObjectURL(preview);
        setPreview(file ? URL.createObjectURL(file) : null);
    };

    const validate = () => {
        const next = {};
        if (!form.nama_produk.trim()) next.nama_produk = "Nama produk wajib diisi.";
        if (!form.id_kategori) next.id_kategori = "Kategori wajib dipilih.";
        if (form.harga === "" || Number(form.harga) < 0) next.harga = "Harga harus angka 0 atau lebih.";
        if (form.stok === "" || Number(form.stok) < 0) next.stok = "Stok harus angka 0 atau lebih.";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            setSaving(true);

            // Laravel method spoofing — unchanged from the original implementation.
            const data = new FormData();
            data.append("id_kategori", form.id_kategori);
            data.append("nama_produk", form.nama_produk);
            data.append("harga", form.harga);
            data.append("stok", form.stok);
            data.append("deskripsi", form.deskripsi || "");
            data.append("_method", "PUT");
            if (form.foto_produk) data.append("foto_produk", form.foto_produk);

            await api.post(`/produk/${id}`, data);

            showToast("Produk berhasil diperbarui.", "success");
            window.setTimeout(() => navigate("/produk"), 1100);
        } catch (error) {
            console.error("Gagal memperbarui produk:", error);
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
            <div>
                <div style={{ maxWidth: 780 }} className="stack gap-20">
                    <SkeletonBox width="40%" height={30} />
                    <SkeletonBox height={420} radius="var(--radius-xl)" />
                </div>
            </div>
        );
    }

    if (notFound) {
        return (
            <EmptyState
                tone="error"
                title="Produk tidak ditemukan"
                description="Produk ini mungkin sudah dihapus atau ID-nya tidak valid."
                action={
                    <button className="btn btn-primary" onClick={() => navigate("/produk")}>
                        Kembali ke daftar produk
                    </button>
                }
            />
        );
    }

    const currentImage = preview || storageUrl(fotoLama) || placeholderImage({ width: 200, height: 200, label: "PREVIEW" });

    return (
        <div>
            <header className="admin-head">
                <div>
                    <button className="back-link" onClick={() => navigate("/produk")} type="button">
                        <i className="bi bi-arrow-left" aria-hidden="true" />
                        Kembali ke produk
                    </button>
                    <h1>Ubah produk</h1>
                    <p>Perbarui informasi, harga, dan stok produk ini.</p>
                </div>
            </header>

            <div className="panel admin-form-card">
                <form onSubmit={handleSubmit} className="panel-body" noValidate>
                    <div className="field-set">
                        <div className="field-set-title">
                            <StickerInline name="pen" size={20} /> Informasi dasar
                        </div>

                        <div className="form-grid-2">
                            <div className="form-group">
                                <label className="form-label" htmlFor="pe-nama">
                                    Nama produk *
                                </label>
                                <input
                                    id="pe-nama"
                                    type="text"
                                    name="nama_produk"
                                    className={`form-control ${errors.nama_produk ? "is-invalid" : ""}`}
                                    value={form.nama_produk}
                                    onChange={handleChange}
                                    disabled={saving}
                                />
                                {errors.nama_produk && <p className="form-error">{errors.nama_produk}</p>}
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="pe-kategori">
                                    Kategori *
                                </label>
                                <select
                                    id="pe-kategori"
                                    name="id_kategori"
                                    className={`form-select ${errors.id_kategori ? "is-invalid" : ""}`}
                                    value={form.id_kategori}
                                    onChange={handleChange}
                                    disabled={saving}
                                >
                                    <option value="">— Pilih kategori —</option>
                                    {kategori.map((item) => (
                                        <option key={item.id_kategori} value={item.id_kategori}>
                                            {item.nama_kategori}
                                        </option>
                                    ))}
                                </select>
                                {errors.id_kategori && <p className="form-error">{errors.id_kategori}</p>}
                            </div>
                        </div>

                        <div className="form-grid-2">
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" htmlFor="pe-harga">
                                    Harga (Rp) *
                                </label>
                                <input
                                    id="pe-harga"
                                    type="number"
                                    name="harga"
                                    min="0"
                                    className={`form-control ${errors.harga ? "is-invalid" : ""}`}
                                    value={form.harga}
                                    onChange={handleChange}
                                    disabled={saving}
                                />
                                {errors.harga && <p className="form-error">{errors.harga}</p>}
                            </div>

                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" htmlFor="pe-stok">
                                    Stok *
                                </label>
                                <input
                                    id="pe-stok"
                                    type="number"
                                    name="stok"
                                    min="0"
                                    className={`form-control ${errors.stok ? "is-invalid" : ""}`}
                                    value={form.stok}
                                    onChange={handleChange}
                                    disabled={saving}
                                />
                                {errors.stok && <p className="form-error">{errors.stok}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="field-set">
                        <div className="field-set-title">
                            <StickerInline name="leaf" size={20} /> Deskripsi & foto
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="pe-deskripsi">
                                Deskripsi
                            </label>
                            <textarea
                                id="pe-deskripsi"
                                name="deskripsi"
                                className="form-textarea"
                                rows="4"
                                value={form.deskripsi}
                                onChange={handleChange}
                                disabled={saving}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" htmlFor="pe-foto">
                                Foto produk
                            </label>
                            <div style={{ display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
                                <img src={currentImage} alt="Pratinjau foto produk" className="image-preview" />
                                <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                                    <label className="form-file" htmlFor="pe-foto">
                                        <i className="bi bi-image" style={{ fontSize: 22, color: "var(--mint-600)" }} aria-hidden="true" />
                                        <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, marginTop: 6 }}>
                                            Ganti gambar
                                        </span>
                                        <input id="pe-foto" type="file" accept="image/*" onChange={handleFile} disabled={saving} />
                                    </label>
                                    <p className="form-hint">Biarkan kosong jika tidak ingin mengubah foto.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="admin-form-actions">
                        <button type="button" className="btn btn-outline" onClick={() => navigate("/produk")} disabled={saving}>
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
};

export default ProdukEditPage;
