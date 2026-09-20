import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomerNavbar from "../../components/CustomerNavbar";
import CustomerFooter from "../../components/CustomerFooter";
import EmptyState from "../../components/common/EmptyState";
import Toast from "../../components/ui/Toast";
import { StickerInline } from "../../components/common/Sticker";
import { productImage, formatRupiah, handleImageError } from "../../components/common/media";
import {
    FREE_SHIPPING_THRESHOLD,
    SHIPPING_FEE,
    cartCount,
    cartSubtotal,
    changeQty,
    getUser,
    readCart,
    removeLine,
    subscribeCart,
} from "../../lib/store";
import "../CustomerPages.css";

const KeranjangPage = () => {
    const navigate = useNavigate();

    const [items, setItems] = useState(readCart);
    const [toast, setToast] = useState({ message: "", type: "info" });

    const showToast = useCallback((message, type = "info") => {
        setToast({ message, type });
        window.setTimeout(() => setToast({ message: "", type }), 3200);
    }, []);

    useEffect(() => {
        const sync = () => setItems(readCart());
        sync();
        return subscribeCart(sync);
    }, []);

    const nudge = (index, delta) => {
        const result = changeQty(index, delta);
        setItems(readCart());
        if (result.removed) showToast("Produk dihapus dari keranjang", "info");
        else if (result.limited) showToast(`Stok tersisa ${result.stok}`, "warning");
    };

    const drop = (index) => {
        removeLine(index);
        setItems(readCart());
        showToast("Produk dihapus dari keranjang", "info");
    };

    const count = cartCount(items);
    const subtotal = cartSubtotal(items);
    const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
    const shipping = items.length === 0 ? 0 : freeShipping ? 0 : SHIPPING_FEE;
    // The checkout endpoint stores the product total, so the figure shown here is
    // the same one that gets submitted. Shipping is presented as an estimate.
    const total = subtotal;
    const progress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

    const goCheckout = () => {
        // Login is only required at checkout — browsing and the cart stay open.
        navigate(getUser() ? "/checkout" : "/login", getUser() ? undefined : { state: { from: "/checkout" } });
    };

    return (
        <div className="customer-page-wrapper">
            <CustomerNavbar />

            <main className="page-main">
                <div className="atelier-container">
                    <header className="page-head">
                        <span className="eyebrow">Keranjang</span>
                        <h1>Tas belanjamu {count > 0 && <span className="text-muted">({count})</span>}</h1>
                        <p>Periksa jumlah dan total sebelum lanjut ke checkout.</p>
                    </header>

                    {items.length === 0 ? (
                        <EmptyState
                            title="Keranjangmu masih ringan"
                            description="Belum ada apa-apa di sini. Lihat katalog dan temukan sesuatu yang pas."
                            action={
                                <button className="btn btn-primary" onClick={() => navigate("/customer/produk")}>
                                    Mulai belanja
                                    <i className="bi bi-arrow-right" aria-hidden="true" />
                                </button>
                            }
                        />
                    ) : (
                        <div className="cart-layout">
                            {/* ── line items ── */}
                            <section className="card" aria-label="Daftar produk di keranjang">
                                {items.map((item, idx) => (
                                    <div className="cart-row" key={item.id_produk ?? idx}>
                                        <img
                                            className="cart-row-img"
                                            src={productImage(item, { width: 200, height: 200 })}
                                            onError={handleImageError(item)}
                                            alt={item.nama_produk}
                                            loading="lazy"
                                        />

                                        <div className="cart-row-info">
                                            <div className="cart-row-name">{item.nama_produk}</div>
                                            <div className="cart-row-unit">Rp {formatRupiah(item.harga)} / pcs</div>
                                        </div>

                                        <div className="cart-row-qty">
                                            <div className="qty-ctrl">
                                                <button type="button" onClick={() => nudge(idx, -1)} aria-label="Kurangi jumlah">
                                                    <i className="bi bi-dash" aria-hidden="true" />
                                                </button>
                                                <span>{item.jumlah}</span>
                                                <button type="button" onClick={() => nudge(idx, 1)} aria-label="Tambah jumlah">
                                                    <i className="bi bi-plus" aria-hidden="true" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="cart-row-total">
                                            Rp {formatRupiah(Number(item.harga || 0) * Number(item.jumlah || 0))}
                                        </div>

                                        <button
                                            type="button"
                                            className="cart-row-remove"
                                            onClick={() => drop(idx)}
                                            aria-label={`Hapus ${item.nama_produk}`}
                                        >
                                            <i className="bi bi-x-lg" aria-hidden="true" />
                                        </button>
                                    </div>
                                ))}

                                <div style={{ marginTop: 22 }}>
                                    <button className="btn btn-ghost btn-sm" onClick={() => navigate("/customer/produk")}>
                                        <i className="bi bi-arrow-left" aria-hidden="true" />
                                        Lanjut belanja
                                    </button>
                                </div>
                            </section>

                            {/* ── summary ── */}
                            <aside className="summary-card">
                                <h3>Ringkasan</h3>

                                <div className="summary-line">
                                    <span>Subtotal ({count} item)</span>
                                    <span>Rp {formatRupiah(subtotal)}</span>
                                </div>
                                <div className="summary-line">
                                    <span>Ongkos kirim (estimasi)</span>
                                    <span style={freeShipping ? { color: "var(--success)" } : undefined}>
                                        {freeShipping ? "Gratis" : `Rp ${formatRupiah(shipping)}`}
                                    </span>
                                </div>

                                {!freeShipping && (
                                    <div className="ship-hint">
                                        <StickerInline name="sparkle" size={15} />
                                        <span>
                                            Tambah Rp {formatRupiah(FREE_SHIPPING_THRESHOLD - subtotal)} lagi untuk gratis ongkir.
                                            <span className="ship-progress">
                                                <span style={{ width: `${progress}%` }} />
                                            </span>
                                        </span>
                                    </div>
                                )}

                                <div className="summary-total">
                                    <span>Total produk</span>
                                    <strong>Rp {formatRupiah(total)}</strong>
                                </div>

                                <button className="btn btn-primary btn-lg btn-block" onClick={goCheckout}>
                                    Lanjut ke checkout
                                    <i className="bi bi-arrow-right" aria-hidden="true" />
                                </button>

                                <p className="caption" style={{ textAlign: "center", marginTop: 14 }}>
                                    Ongkos kirim dikonfirmasi terpisah. Kamu perlu masuk untuk menyelesaikan pesanan.
                                </p>
                            </aside>
                        </div>
                    )}
                </div>
            </main>

            <CustomerFooter />

            <div className="toast-container">
                <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
            </div>
        </div>
    );
};

export default KeranjangPage;
