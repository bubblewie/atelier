import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import EmptyState from "../../components/common/EmptyState";
import Toast from "../../components/ui/Toast";
import { StickerInline } from "../../components/common/Sticker";
import { productImage, formatRupiah, handleImageError } from "../../components/common/media";
import {
    cartCount,
    cartSubtotal,
    changeQty,
    clearCart,
    getUser,
    getUserId,
    readCart,
    removeLine,
} from "../../lib/store";
import "../AdminPages.css";


const PAYMENTS = [
    { id: "transfer_bank", title: "Transfer Bank", desc: "BCA / Mandiri / BNI Virtual Account", icon: "bi-bank" },
    { id: "ewallet", title: "E-Wallet", desc: "GoPay / OVO / ShopeePay", icon: "bi-wallet2" },
    { id: "cod", title: "Bayar di Tempat (COD)", desc: "Bayar saat paket diterima", icon: "bi-box-seam" },
];

/**
 * Pembuatan pesanan manual dari sisi admin.
 *
 * Halaman lama mengirim `id_user: 1` yang di-hardcode, sehingga setiap pesanan
 * yang dibuat lewat sini tercatat atas nama user pertama di database. Sekarang
 * id diambil dari sesi yang sedang login. Endpoint, method, dan bentuk payload
 * tetap sama persis seperti sebelumnya (`POST /checkout`).
 */
const PesananCreatePage = () => {
    const navigate = useNavigate();

    const [keranjang, setKeranjang] = useState(readCart);
    const [catatan, setCatatan] = useState("");
    const [metodePembayaran, setMetodePembayaran] = useState("transfer_bank");
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ message: "", type: "error" });

    const user = getUser();

    const showToast = useCallback((message, type = "error") => {
        setToast({ message, type });
        window.setTimeout(() => setToast({ message: "", type }), 3800);
    }, []);

    useEffect(() => {
        setKeranjang(readCart());
    }, []);

    const totalItem = cartCount(keranjang);
    const totalHarga = cartSubtotal(keranjang);

    const nudge = (index, delta) => {
        const result = changeQty(index, delta);
        setKeranjang(readCart());
        if (result.limited) showToast(`Stok tersisa ${result.stok}`, "warning");
    };

    const hapusBaris = (index) => {
        removeLine(index);
        setKeranjang(readCart());
        showToast("Produk dihapus dari daftar", "info");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (keranjang.length === 0) {
            showToast("Belum ada produk yang dipilih", "warning");
            return;
        }

        const id_user = getUserId(user);
        if (!id_user) {
            showToast("Sesi kamu sudah berakhir. Silakan masuk kembali.", "error");
            navigate("/login", { state: { from: "/pesanan/tambah" } });
            return;
        }

        const dataCheckout = {
            id_user: Number(id_user),
            total_harga: Number(totalHarga || 0),
            metode_pembayaran: metodePembayaran,
            catatan: catatan.trim() || null,
            items: keranjang.map((item) => ({
                id_produk: Number(item.id_produk),
                jumlah: Number(item.jumlah || 1),
                harga: Number(item.harga || 0),
            })),
        };

        try {
            setLoading(true);
            const response = await api.post(`/checkout`, dataCheckout);
            const pesanan = response.data?.data;

            clearCart();
            setKeranjang([]);
            showToast("Pesanan berhasil dibuat", "success");

            window.setTimeout(() => {
                if (pesanan?.id_pesanan) navigate(`/pembayaran/${pesanan.id_pesanan}`);
                else navigate("/pesanan");
            }, 900);
        } catch (error) {
            console.error("Gagal membuat pesanan:", error);
            if (error.response?.status === 401) {
                showToast("Sesi kamu sudah berakhir. Silakan masuk kembali.", "error");
                navigate("/login", { state: { from: "/pesanan/tambah" } });
                return;
            }
            const errors = error.response?.data?.errors;
            showToast(
                errors
                    ? Object.values(errors).flat().join(", ")
                    : error.response?.data?.message || "Gagal membuat pesanan. Silakan coba lagi.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <header className="admin-head">
                <div>
                    <span className="eyebrow">Penjualan</span>
                    <h1>Buat Pesanan</h1>
                    <p>Susun pesanan manual dari produk yang ada di keranjang aktif.</p>
                </div>
                <div className="admin-head-actions">
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate("/pesanan")}>
                        <i className="bi bi-arrow-left" aria-hidden="true" />
                        Kembali
                    </button>
                    <button type="button" className="btn btn-mint btn-sm" onClick={() => navigate("/customer/produk")}>
                        <i className="bi bi-plus-lg" aria-hidden="true" />
                        Pilih produk
                    </button>
                </div>
            </header>

            {keranjang.length === 0 ? (
                <EmptyState
                    sticker="leaf"
                    title="Belum ada produk dipilih"
                    description="Tambahkan produk dari katalog terlebih dahulu, lalu kembali ke halaman ini untuk menyelesaikan pesanan."
                    action={
                        <button className="btn btn-primary" onClick={() => navigate("/customer/produk")}>
                            Buka katalog
                        </button>
                    }
                />
            ) : (
                <form
                    onSubmit={handleSubmit}
                    style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1.6fr) minmax(280px, 1fr)",
                        gap: 26,
                        alignItems: "start",
                    }}
                    className="pesanan-create-grid"
                >
                    <div>
                        {/* ── Item ── */}
                        <div className="panel" style={{ marginBottom: 24 }}>
                            <div className="panel-head">
                                <h3>Item pesanan ({totalItem})</h3>
                            </div>
                            <div className="panel-body">
                                {keranjang.map((item, idx) => (
                                    <div
                                        key={item.id_produk ?? idx}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 16,
                                            padding: "14px 0",
                                            borderBottom:
                                                idx === keranjang.length - 1 ? "none" : "1px solid var(--border-color)",
                                        }}
                                    >
                                        <img
                                            src={productImage(item, { width: 140, height: 140 })}
                                            onError={handleImageError(item)}
                                            alt={item.nama_produk}
                                            style={{
                                                width: 62,
                                                height: 62,
                                                borderRadius: "var(--radius-sm)",
                                                objectFit: "cover",
                                                background: "var(--mint-50)",
                                                flexShrink: 0,
                                            }}
                                        />

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div
                                                style={{
                                                    fontFamily: "var(--font-display)",
                                                    fontWeight: 500,
                                                    color: "var(--text-heading)",
                                                }}
                                            >
                                                {item.nama_produk}
                                            </div>
                                            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                                                Rp {formatRupiah(item.harga)} / pcs
                                            </div>
                                        </div>

                                        <div className="qty-ctrl">
                                            <button type="button" onClick={() => nudge(idx, -1)} aria-label="Kurangi jumlah">
                                                <i className="bi bi-dash" aria-hidden="true" />
                                            </button>
                                            <span>{item.jumlah}</span>
                                            <button type="button" onClick={() => nudge(idx, 1)} aria-label="Tambah jumlah">
                                                <i className="bi bi-plus" aria-hidden="true" />
                                            </button>
                                        </div>

                                        <div
                                            style={{
                                                fontFamily: "var(--font-display)",
                                                fontWeight: 600,
                                                color: "var(--text-heading)",
                                                minWidth: 110,
                                                textAlign: "right",
                                            }}
                                        >
                                            Rp {formatRupiah(Number(item.harga || 0) * Number(item.jumlah || 0))}
                                        </div>

                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-xs"
                                            style={{ color: "var(--error)" }}
                                            onClick={() => hapusBaris(idx)}
                                            aria-label={`Hapus ${item.nama_produk}`}
                                        >
                                            <i className="bi bi-x-lg" aria-hidden="true" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── Pembayaran ── */}
                        <div className="panel" style={{ marginBottom: 24 }}>
                            <div className="panel-head">
                                <h3>Metode pembayaran</h3>
                            </div>
                            <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {PAYMENTS.map((m) => (
                                    <label
                                        key={m.id}
                                        className={`option-card ${metodePembayaran === m.id ? "selected" : ""}`}
                                    >
                                        <input
                                            type="radio"
                                            name="metode_pembayaran"
                                            value={m.id}
                                            checked={metodePembayaran === m.id}
                                            onChange={(e) => setMetodePembayaran(e.target.value)}
                                        />
                                        <i
                                            className={`bi ${m.icon}`}
                                            style={{ fontSize: 19, color: "var(--mint-600)" }}
                                            aria-hidden="true"
                                        />
                                        <span>
                                            <span className="option-card-title">{m.title}</span>
                                            <span className="option-card-desc">{m.desc}</span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* ── Catatan ── */}
                        <div className="panel">
                            <div className="panel-head">
                                <h3>Catatan (opsional)</h3>
                            </div>
                            <div className="panel-body">
                                <label className="form-label" htmlFor="catatan-pesanan">
                                    Instruksi khusus
                                </label>
                                <textarea
                                    id="catatan-pesanan"
                                    className="form-textarea"
                                    rows="3"
                                    value={catatan}
                                    onChange={(e) => setCatatan(e.target.value)}
                                    placeholder="Permintaan pembungkusan, catatan kartu ucapan, dan sebagainya…"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Ringkasan ── */}
                    <aside className="summary-card">
                        <h3>
                            <StickerInline name="sparkle" size={18} /> Ringkasan
                        </h3>

                        <div className="summary-line">
                            <span>Jumlah item</span>
                            <span>{totalItem}</span>
                        </div>
                        <div className="summary-line">
                            <span>Dibuat oleh</span>
                            <span>{user?.nama || user?.name || "—"}</span>
                        </div>

                        <div className="summary-total">
                            <span>Total</span>
                            <strong>Rp {formatRupiah(totalHarga)}</strong>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
                            {loading && <span className="spin" />}
                            {loading ? "Menyimpan..." : "Simpan pesanan"}
                        </button>

                        <p className="caption" style={{ marginTop: 14, textAlign: "center" }}>
                            Pesanan akan tercatat atas akun yang sedang masuk.
                        </p>
                    </aside>
                </form>
            )}

            <div className="toast-container">
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ message: "", type: "error" })}
                />
            </div>
        </div>
    );
};

export default PesananCreatePage;
