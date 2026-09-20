import React from "react";
import { useNavigate } from "react-router-dom";
import { StickerInline } from "./common/Sticker";
import "./CustomerFooter.css";

const CustomerFooter = () => {
    const navigate = useNavigate();
    const year = new Date().getFullYear();

    const shop = [
        { label: "Semua Produk", to: "/customer/produk" },
        { label: "Koleksi Terbaru", to: "/customer/produk" },
        { label: "Paling Disukai", to: "/customer/produk" },
        { label: "Keranjang", to: "/keranjang" },
    ];

    const account = [
        { label: "Masuk", to: "/login" },
        { label: "Buat Akun", to: "/register" },
        { label: "Dashboard Saya", to: "/customer/dashboard" },
        { label: "Pesanan Saya", to: "/customer/pesanan-saya" },
    ];

    return (
        <footer className="atelier-footer">
            <div className="atelier-container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <div className="footer-logo">
                            Atelier<span className="brand-mark">®</span>
                        </div>
                        <p>
                            Hal-hal kecil, dibuat dengan rapi. Studio alat tulis dan perlengkapan kreatif
                            untuk catatan, rencana, dan ide harianmu.
                        </p>
                        <div className="footer-stickers" aria-hidden="true">
                            <StickerInline name="leaf" size={26} rotate={-12} />
                            <StickerInline name="sparkle" size={20} rotate={8} />
                            <StickerInline name="heart" size={22} rotate={-4} />
                        </div>
                    </div>

                    <nav className="footer-col" aria-label="Belanja">
                        <h4>Belanja</h4>
                        <ul>
                            {shop.map((item) => (
                                <li key={item.label}>
                                    <button type="button" onClick={() => navigate(item.to)}>
                                        {item.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <nav className="footer-col" aria-label="Akun">
                        <h4>Akun</h4>
                        <ul>
                            {account.map((item) => (
                                <li key={item.label}>
                                    <button type="button" onClick={() => navigate(item.to)}>
                                        {item.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="footer-col footer-note-col">
                        <h4>Studio</h4>
                        <div className="note-card">
                            <strong style={{ display: "block", marginBottom: 6, fontFamily: "var(--font-display)" }}>
                                Dibungkus dengan tangan
                            </strong>
                            Setiap pesanan dikemas ulang dengan kertas daur ulang dan kartu ucapan kecil.
                        </div>
                    </div>
                </div>

                <div className="dotted-rule" />

                <div className="footer-bottom">
                    <span>© {year} Atelier Studio. Seluruh hak cipta dilindungi.</span>
                    <span className="handwritten">made with care, one page at a time</span>
                </div>
            </div>
        </footer>
    );
};

export default CustomerFooter;
