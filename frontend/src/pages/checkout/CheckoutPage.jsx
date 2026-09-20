import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import CustomerNavbar from "../../components/CustomerNavbar";
import CustomerFooter from "../../components/CustomerFooter";
import EmptyState from "../../components/common/EmptyState";
import Toast from "../../components/ui/Toast";
import { StickerInline } from "../../components/common/Sticker";
import { formatRupiah } from "../../components/common/media";
import { cartCount, cartSubtotal, clearCart, getUser, getUserId, readCart } from "../../lib/store";
import "../CustomerPages.css";


const PAYMENTS = [
    { id: "transfer_bank", title: "Transfer Bank", desc: "BCA / Mandiri / BNI Virtual Account", icon: "bi-bank" },
    { id: "ewallet", title: "E-Wallet", desc: "GoPay / OVO / ShopeePay", icon: "bi-wallet2" },
    { id: "cod", title: "Bayar di Tempat (COD)", desc: "Bayar saat paket diterima", icon: "bi-box-seam" },
];

const CheckoutPage = () => {
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (keranjang.length === 0) {
            showToast("Keranjang belanja kamu kosong", "warning");
            return;
        }

        const id_user = getUserId(user);
        if (!id_user) {
            showToast("Sesi kamu sudah berakhir. Silakan masuk kembali.", "error");
            navigate("/login", { state: { from: "/checkout" } });
            return;
        }

        // Payload shape is exactly what the existing /checkout endpoint expects.
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

            if (pesanan?.id_pesanan) {
                navigate(`/pembayaran/${pesanan.id_pesanan}`, { state: { justPlaced: true } });
            } else {
                navigate("/customer/pesanan-saya", { state: { justPlaced: true } });
            }
        } catch (error) {
            console.error("Checkout error:", error);

            const status = error.response?.status;
            const errors = error.response?.data?.errors;

            if (status === 422 && errors) {
                showToast(Object.values(errors).flat().join(" · "), "error");
            } else if (status === 401) {
                showToast("Sesi kamu sudah berakhir. Silakan masuk kembali.", "error");
                navigate("/login", { state: { from: "/checkout" } });
            } else {
                showToast(
                    error.response?.data?.message || "Pesanan gagal diproses. Coba beberapa saat lagi.",
                    "error"
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="customer-page-wrapper">
            <CustomerNavbar />

            <main className="page-main">
                <div className="atelier-container">
                    <header className="page-head">
                        <span className="eyebrow">Checkout</span>
                        <h1>Selesaikan pesananmu</h1>
                        <p>Periksa data penerima dan metode pembayaran, lalu buat pesanan.</p>
                    </header>

                    <div className="checkout-steps">
                        <span className="checkout-step">
                            <span className="num">1</span> Keranjang
                        </span>
                        <span className="checkout-step-sep">
                            <i className="bi bi-chevron-right" aria-hidden="true" />
                        </span>
                        <span className="checkout-step current">
                            <span className="num">2</span> Checkout
                        </span>
                        <span className="checkout-step-sep">
                            <i className="bi bi-chevron-right" aria-hidden="true" />
                        </span>
                        <span className="checkout-step">
                            <span className="num">3</span> Selesai
                        </span>
                    </div>

                    {keranjang.length === 0 ? (
                        <EmptyState
                            title="Tidak ada yang bisa di-checkout"
                            description="Keranjangmu kosong. Tambahkan produk terlebih dahulu."
                            action={
                                <button className="btn btn-primary" onClick={() => navigate("/customer/produk")}>
                                    Lihat katalog
                                </button>
                            }
                        />
                    ) : (
                        <form className="checkout-layout" onSubmit={handleSubmit}>
                            <div>
                                {/* ── contact ── */}
                                <section className="card" style={{ marginBottom: 24 }}>
                                    <div className="field-set-title">
                                        <StickerInline name="sparkle" size={20} /> Data penerima
                                    </div>

                                    <div className="form-grid-2">
                                        <div className="form-group">
                                            <label className="form-label" htmlFor="co-nama">
                                                Nama lengkap
                                            </label>
                                            <input
                                                id="co-nama"
                                                type="text"
                                                className="form-control"
                                                value={user?.nama || user?.name || ""}
                                                disabled
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label" htmlFor="co-email">
                                                Email
                                            </label>
                                            <input id="co-email" type="email" className="form-control" value={user?.email || ""} disabled />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" htmlFor="co-telp">
                                            Nomor telepon
                                        </label>
                                        <input
                                            id="co-telp"
                                            type="text"
                                            className="form-control"
                                            value={user?.no_telepon || "—"}
                                            disabled
                                        />
                                    </div>

                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label" htmlFor="co-alamat">
                                            Alamat pengiriman
                                        </label>
                                        <textarea
                                            id="co-alamat"
                                            className="form-textarea"
                                            rows="3"
                                            value={user?.alamat || "Belum ada alamat tersimpan di profil."}
                                            disabled
                                        />
                                        <p className="form-hint">Data ini diambil dari akunmu saat mendaftar.</p>
                                    </div>
                                </section>

                                {/* ── payment ── */}
                                <section className="card" style={{ marginBottom: 24 }}>
                                    <div className="field-set-title">
                                        <StickerInline name="star" size={20} /> Metode pembayaran
                                    </div>

                                    <div className="stack gap-12">
                                        {PAYMENTS.map((method) => (
                                            <label
                                                key={method.id}
                                                className={`option-card ${metodePembayaran === method.id ? "selected" : ""}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="metodePembayaran"
                                                    value={method.id}
                                                    checked={metodePembayaran === method.id}
                                                    onChange={(e) => setMetodePembayaran(e.target.value)}
                                                />
                                                <i
                                                    className={`bi ${method.icon}`}
                                                    style={{ fontSize: 20, color: "var(--mint-600)" }}
                                                    aria-hidden="true"
                                                />
                                                <span>
                                                    <span className="option-card-title">{method.title}</span>
                                                    <span className="option-card-desc">{method.desc}</span>
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </section>

                                {/* ── notes ── */}
                                <section className="card">
                                    <div className="field-set-title">
                                        <StickerInline name="heart" size={20} /> Catatan (opsional)
                                    </div>
                                    <label className="form-label" htmlFor="co-catatan" style={{ position: "absolute", left: -9999 }}>
                                        Catatan pesanan
                                    </label>
                                    <textarea
                                        id="co-catatan"
                                        className="form-textarea"
                                        rows="3"
                                        placeholder="Permintaan khusus, pesan untuk kartu ucapan, atau instruksi pengiriman…"
                                        value={catatan}
                                        onChange={(e) => setCatatan(e.target.value)}
                                    />
                                </section>
                            </div>

                            {/* ── summary ── */}
                            <aside className="summary-card">
                                <h3>Ringkasan ({totalItem} item)</h3>

                                <div style={{ marginBottom: 18 }}>
                                    {keranjang.map((item, idx) => (
                                        <div className="mini-line" key={item.id_produk ?? idx}>
                                            <span>
                                                {item.nama_produk} × {item.jumlah}
                                            </span>
                                            <span>
                                                Rp {formatRupiah(Number(item.harga || 0) * Number(item.jumlah || 0))}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="summary-total">
                                    <span>Total pembayaran</span>
                                    <strong>Rp {formatRupiah(totalHarga)}</strong>
                                </div>

                                <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
                                    {loading && <span className="spin" />}
                                    {loading ? "Memproses pesanan…" : "Buat pesanan"}
                                    {!loading && <i className="bi bi-arrow-right" aria-hidden="true" />}
                                </button>

                                <p className="caption" style={{ textAlign: "center", marginTop: 14 }}>
                                    Dengan membuat pesanan, kamu setuju dengan ketentuan Atelier Studio.
                                </p>
                            </aside>
                        </form>
                    )}
                </div>
            </main>

            <CustomerFooter />

            <div className="toast-container">
                <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "error" })} />
            </div>
        </div>
    );
};

export default CheckoutPage;
