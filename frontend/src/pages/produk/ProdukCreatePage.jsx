import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import Toast from "../../components/ui/Toast";
import { StickerInline } from "../../components/common/Sticker";
import { placeholderImage } from "../../components/common/media";
import "../AdminPages.css";

function ProdukCreatePage() {
    const navigate = useNavigate();

    const [kategori, setKategori] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
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

    useEffect(() => {
        (async () => {
            try {
                const response = await api.get("/kategori");
                setKategori(response.data?.data || []);
            } catch (error) {
                console.error("Gagal mengambil kategori:", error);
                showToast("Daftar kategori gagal dimuat.", "error");
            }
        })();
    }, []);

    /* Revoke the object URL when the preview changes or the page unmounts. */
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
        setErrors((prev) => ({ ...prev, foto_produk: "" }));

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
            setLoading(true);

            // Multipart payload — field names match the existing /produk endpoint.
            const formData = new FormData();
            formData.append("id_kategori", form.id_kategori);
            formData.append("nama_produk", form.nama_produk);
            formData.append("harga", form.harga);
            formData.append("stok", form.stok);
            formData.append("deskripsi", form.deskripsi || "");
            if (form.foto_produk) formData.append("foto_produk", form.foto_produk);

            await api.post("/produk", formData);

            showToast("Produk berhasil ditambahkan.", "success");
            window.setTimeout(() => navigate("/produk"), 1100);
        } catch (error) {
            console.error("Gagal menambahkan produk:", error);
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

            showToast(error.response?.data?.message || "Produk gagal disimpan.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <header className="admin-head">
                <div>
                    <button className="back-link" onClick={() => navigate("/produk")} type="button">
                        <i className="bi bi-arrow-left" aria-hidden="true" />
                        Kembali ke produk
                    </button>
                    <h1>Tambah produk</h1>
                    <p>Buat item baru untuk katalog Atelier.</p>
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
                                <label className="form-label" htmlFor="pc-nama">
                                    Nama produk *
                                </label>
                                <input
                                    id="pc-nama"
                                    type="text"
                                    name="nama_produk"
                                    className={`form-control ${errors.nama_produk ? "is-invalid" : ""}`}
                                    value={form.nama_produk}
                                    onChange={handleChange}
                                    placeholder="Contoh: Jurnal Linen A5"
                                    disabled={loading}
                                />
                                {errors.nama_produk && <p className="form-error">{errors.nama_produk}</p>}
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="pc-kategori">
                                    Kategori *
                                </label>
                                <select
                                    id="pc-kategori"
                                    name="id_kategori"
                                    className={`form-select ${errors.id_kategori ? "is-invalid" : ""}`}
                                    value={form.id_kategori}
                                    onChange={handleChange}
                                    disabled={loading}
                                >
                                    <option value="">— Pilih kategori —</option>
                                    {kategori.map((item) => (
                                        <option key={item.id_kategori} value={item.id_kategori}>
                                            {item.nama_kategori}
                                        </option>
                                    ))}
                                </select>
                                {errors.id_kategori ? (
                                    <p className="form-error">{errors.id_kategori}</p>
                                ) : (
                                    kategori.length === 0 && (
                                        <p className="form-hint">
                                            Belum ada kategori.{" "}
                                            <button
                                                type="button"
                                                className="auth-link"
                                                onClick={() => navigate("/kategori/create")}
                                            >
                                                Buat dulu
                                            </button>
                                        </p>
                                    )
                                )}
                            </div>
                        </div>

                        <div className="form-grid-2">
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" htmlFor="pc-harga">
                                    Harga (Rp) *
                                </label>
                                <input
                                    id="pc-harga"
                                    type="number"
                                    name="harga"
                                    min="0"
                                    className={`form-control ${errors.harga ? "is-invalid" : ""}`}
                                    value={form.harga}
                                    onChange={handleChange}
                                    placeholder="45000"
                                    disabled={loading}
                                />
                                {errors.harga && <p className="form-error">{errors.harga}</p>}
                            </div>

                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" htmlFor="pc-stok">
                                    Stok *
                                </label>
                                <input
                                    id="pc-stok"
                                    type="number"
                                    name="stok"
                                    min="0"
                                    className={`form-control ${errors.stok ? "is-invalid" : ""}`}
                                    value={form.stok}
                                    onChange={handleChange}
                                    placeholder="25"
                                    disabled={loading}
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
                            <label className="form-label" htmlFor="pc-deskripsi">
                                Deskripsi
                            </label>
                            <textarea
                                id="pc-deskripsi"
                                name="deskripsi"
                                className="form-textarea"
                                rows="4"
                                value={form.deskripsi}
                                onChange={handleChange}
                                placeholder="Bahan, ukuran, dan hal yang perlu diketahui pembeli…"
                                disabled={loading}
                            />
                            {errors.deskripsi && <p className="form-error">{errors.deskripsi}</p>}
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" htmlFor="pc-foto">
                                Foto produk
                            </label>
                            <div style={{ display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
                                <img
                                    src={preview || placeholderImage({ width: 200, height: 200, label: "PREVIEW" })}
                                    alt="Pratinjau foto produk"
                                    className="image-preview"
                                />
                                <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                                    <label className="form-file" htmlFor="pc-foto">
                                        <i className="bi bi-image" style={{ fontSize: 22, color: "var(--mint-600)" }} aria-hidden="true" />
                                        <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, marginTop: 6 }}>
                                            Pilih gambar produk
                                        </span>
                                        <input id="pc-foto" type="file" accept="image/*" onChange={handleFile} disabled={loading} />
                                    </label>
                                    {errors.foto_produk && <p className="form-error">{errors.foto_produk}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="admin-form-actions">
                        <button type="button" className="btn btn-outline" onClick={() => navigate("/produk")} disabled={loading}>
                            Batal
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading && <span className="spin" />}
                            {loading ? "Menyimpan…" : "Simpan produk"}
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

export default ProdukCreatePage;
