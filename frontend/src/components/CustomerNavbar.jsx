import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import Toast from "./ui/Toast";
import ThemeToggle from "./common/ThemeToggle";
import { StickerInline } from "./common/Sticker";
import { productImage, formatRupiah, handleImageError } from "./common/media";
import {
    cartCount as countCart,
    cartSubtotal,
    changeQty,
    clearSession,
    getUser,
    isAdmin,
    readCart,
    subscribeCart,
} from "../lib/store";
import "./CustomerNavbar.css";


const ANNOUNCEMENTS = [
    "Gratis ongkir untuk pembelian di atas Rp300.000",
    "Koleksi baru setiap Jumat — hanya di Atelier Studio",
    "Setiap pesanan dibungkus tangan dengan kartu ucapan",
];

const SHOP_LINKS = [
    { label: "Semua Produk", desc: "Seluruh katalog Atelier", to: "/customer/produk" },
    { label: "Stationery", desc: "Pena, tinta, dan alat tulis", kategori: "Stationery" },
    { label: "Notebooks", desc: "Jurnal dan buku catatan", kategori: "Notebooks" },
    { label: "Accessories", desc: "Stiker, washi tape, pouch", kategori: "Accessories" },
];

const CustomerNavbar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [items, setItems] = useState(readCart);
    const [cartOpen, setCartOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [shopOpen, setShopOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [scrolled, setScrolled] = useState(false);
    const [announceIdx, setAnnounceIdx] = useState(0);
    const [user, setUser] = useState(getUser);
    const [toast, setToast] = useState({ message: "", type: "info" });

    const accountRef = useRef(null);

    const count = countCart(items);
    const subtotal = cartSubtotal(items);

    const showToast = useCallback((message, type = "info") => {
        setToast({ message, type });
        window.setTimeout(() => setToast({ message: "", type }), 3200);
    }, []);

    /* ---------------------------------------------------- sync cart + user */
    useEffect(() => {
        const sync = () => setItems(readCart());
        sync();
        setUser(getUser());
        return subscribeCart(sync);
    }, [location.pathname]);

    /* ------------------------------------------------------ scroll + timer */
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 16);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        const id = window.setInterval(
            () => setAnnounceIdx((i) => (i + 1) % ANNOUNCEMENTS.length),
            5200
        );
        return () => window.clearInterval(id);
    }, []);

    /* ------------------------------------------- close menus on navigation */
    useEffect(() => {
        setMenuOpen(false);
        setCartOpen(false);
        setAccountOpen(false);
        setShopOpen(false);
        setSearchOpen(false);
    }, [location.pathname]);

    /* --------------------------------------------- outside click / escape  */
    useEffect(() => {
        const onClick = (e) => {
            if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
        };
        const onKey = (e) => {
            if (e.key !== "Escape") return;
            setCartOpen(false);
            setMenuOpen(false);
            setAccountOpen(false);
            setSearchOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        window.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            window.removeEventListener("keydown", onKey);
        };
    }, []);

    /* --------------------------------------------------- lock body scroll  */
    useEffect(() => {
        const locked = cartOpen || menuOpen;
        document.body.style.overflow = locked ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [cartOpen, menuOpen]);

    /* ------------------------------------------------------------ actions  */
    const goCategory = (kategori) => navigate("/customer/produk", { state: { kategori } });

    const handleSearch = (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        navigate("/customer/produk", { state: { search: query.trim() } });
        setSearchOpen(false);
    };

    const handleAccount = () => {
        if (!user) {
            navigate("/login");
            return;
        }
        setAccountOpen((v) => !v);
    };

    const handleLogout = async () => {
        setAccountOpen(false);
        setMenuOpen(false);
        const token = localStorage.getItem("token");
        try {
            await api.post(`/logout`,
                {},
                token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
            );
        } catch (error) {
            // Session is cleared locally regardless — the token may already be expired.
            console.error("Logout:", error);
        } finally {
            clearSession();
            setUser(null);
            showToast("Kamu sudah keluar dari akun", "info");
            navigate("/login");
        }
    };

    const nudge = (index, delta) => {
        const result = changeQty(index, delta);
        setItems(readCart());
        if (result.removed) showToast("Produk dihapus dari keranjang", "info");
        else if (result.limited) showToast(`Stok tersisa ${result.stok}`, "warning");
    };

    const isActive = (path) =>
        path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

    return (
        <>
            {/* ── ANNOUNCEMENT BAR ── */}
            <div className="announce-bar">
                <div className="announce-track">
                    <StickerInline name="sparkle" size={14} />
                    <span key={announceIdx} className="announce-text">
                        {ANNOUNCEMENTS[announceIdx]}
                    </span>
                    <StickerInline name="sparkle" size={14} />
                </div>
            </div>

            {/* ── FLOATING NAVBAR ── */}
            <div className={`nav-wrapper ${scrolled ? "is-scrolled" : ""}`}>
                <header className="nav-shell">
                    <nav className="nav-inner" aria-label="Navigasi utama">
                        {/* left */}
                        <div className="nav-side nav-side-left">
                            <button
                                className="icon-btn nav-burger"
                                onClick={() => setMenuOpen(true)}
                                aria-label="Buka menu"
                                type="button"
                            >
                                <i className="bi bi-list" aria-hidden="true" />
                            </button>

                            <ul className="nav-links">
                                <li
                                    className="nav-item has-menu"
                                    onMouseEnter={() => setShopOpen(true)}
                                    onMouseLeave={() => setShopOpen(false)}
                                >
                                    <button
                                        type="button"
                                        className={`nav-link ${isActive("/customer/produk") ? "active" : ""}`}
                                        onClick={() => navigate("/customer/produk")}
                                        aria-expanded={shopOpen}
                                    >
                                        Shop
                                        <i className="bi bi-chevron-down nav-caret" aria-hidden="true" />
                                    </button>

                                    <div className={`mega-menu ${shopOpen ? "open" : ""}`}>
                                        <span className="mega-eyebrow eyebrow">Katalog</span>
                                        {SHOP_LINKS.map((link) => (
                                            <button
                                                key={link.label}
                                                type="button"
                                                className="mega-item"
                                                onClick={() =>
                                                    link.to ? navigate(link.to) : goCategory(link.kategori)
                                                }
                                            >
                                                <span>
                                                    <span className="mega-item-label">{link.label}</span>
                                                    <span className="mega-item-desc">{link.desc}</span>
                                                </span>
                                                <i className="bi bi-arrow-right" aria-hidden="true" />
                                            </button>
                                        ))}
                                    </div>
                                </li>

                                <li className="nav-item">
                                    <button
                                        type="button"
                                        className={`nav-link ${isActive("/") ? "active" : ""}`}
                                        onClick={() => navigate("/")}
                                    >
                                        Beranda
                                    </button>
                                </li>

                                {user && !isAdmin(user) && (
                                    <li className="nav-item">
                                        <button
                                            type="button"
                                            className={`nav-link ${isActive("/customer/pesanan") ? "active" : ""}`}
                                            onClick={() => navigate("/customer/pesanan-saya")}
                                        >
                                            Pesanan Saya
                                        </button>
                                    </li>
                                )}
                            </ul>
                        </div>

                        {/* center */}
                        <button type="button" className="brand" onClick={() => navigate("/")}>
                            Atelier<span className="brand-mark">®</span>
                        </button>

                        {/* right */}
                        <div className="nav-side nav-side-right">
                            <button
                                className="icon-btn"
                                onClick={() => setSearchOpen((v) => !v)}
                                aria-label="Cari produk"
                                aria-expanded={searchOpen}
                                type="button"
                            >
                                <i className="bi bi-search" aria-hidden="true" />
                            </button>

                            <span className="nav-theme">
                                <ThemeToggle className="icon-btn" compact />
                            </span>

                            <div className="nav-account" ref={accountRef}>
                                <button
                                    className="icon-btn"
                                    onClick={handleAccount}
                                    aria-label={user ? "Menu akun" : "Masuk"}
                                    aria-expanded={accountOpen}
                                    type="button"
                                >
                                    <i className="bi bi-person" aria-hidden="true" />
                                </button>

                                {accountOpen && user && (
                                    <div className="account-pop" role="menu">
                                        <div className="account-head">
                                            <div className="account-name">{user.nama || user.name}</div>
                                            <div className="account-mail">{user.email}</div>
                                        </div>
                                        <button
                                            type="button"
                                            className="account-action"
                                            onClick={() => {
                                                setAccountOpen(false);
                                                navigate(isAdmin(user) ? "/dashboard" : "/customer/dashboard");
                                            }}
                                        >
                                            <i className="bi bi-grid" aria-hidden="true" />
                                            {isAdmin(user) ? "Atelier Studio" : "Dashboard Saya"}
                                        </button>
                                        {!isAdmin(user) && (
                                            <button
                                                type="button"
                                                className="account-action"
                                                onClick={() => {
                                                    setAccountOpen(false);
                                                    navigate("/customer/pesanan-saya");
                                                }}
                                            >
                                                <i className="bi bi-bag-check" aria-hidden="true" />
                                                Pesanan Saya
                                            </button>
                                        )}
                                        {!isAdmin(user) && (
                                            <button
                                                type="button"
                                                className="account-action"
                                                onClick={() => {
                                                    setAccountOpen(false);
                                                    navigate("/customer/profil");
                                                }}
                                            >
                                                <i className="bi bi-person-gear" aria-hidden="true" />
                                                Profil Saya
                                            </button>
                                        )}
                                        <button type="button" className="account-action danger" onClick={handleLogout}>
                                            <i className="bi bi-box-arrow-right" aria-hidden="true" />
                                            Keluar
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button
                                className="icon-btn cart-btn"
                                onClick={() => setCartOpen(true)}
                                aria-label={`Keranjang, ${count} item`}
                                type="button"
                            >
                                <i className="bi bi-bag" aria-hidden="true" />
                                {count > 0 && <span className="cart-dot">{count}</span>}
                            </button>
                        </div>
                    </nav>

                    {searchOpen && (
                        <form className="nav-search" onSubmit={handleSearch} role="search">
                            <i className="bi bi-search" aria-hidden="true" />
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Cari jurnal, pena, stiker…"
                                aria-label="Kata kunci pencarian"
                                autoFocus
                            />
                            <button type="submit" className="btn btn-primary btn-sm">
                                Cari
                            </button>
                        </form>
                    )}
                </header>
            </div>

            {/* ── MOBILE DRAWER ── */}
            {menuOpen && (
                <div className="drawer-backdrop" onClick={() => setMenuOpen(false)}>
                    <aside className="drawer drawer-left" onClick={(e) => e.stopPropagation()}>
                        <div className="drawer-head">
                            <span className="brand">
                                Atelier<span className="brand-mark">®</span>
                            </span>
                            <button className="icon-btn" onClick={() => setMenuOpen(false)} aria-label="Tutup menu" type="button">
                                <i className="bi bi-x-lg" aria-hidden="true" />
                            </button>
                        </div>

                        <div className="drawer-body">
                            <span className="eyebrow">Menu</span>
                            <button type="button" className="drawer-link" onClick={() => navigate("/")}>
                                Beranda
                            </button>
                            <button type="button" className="drawer-link" onClick={() => navigate("/customer/produk")}>
                                Semua Produk
                            </button>
                            {SHOP_LINKS.filter((l) => l.kategori).map((link) => (
                                <button
                                    key={link.label}
                                    type="button"
                                    className="drawer-link sub"
                                    onClick={() => goCategory(link.kategori)}
                                >
                                    {link.label}
                                </button>
                            ))}

                            <div className="dotted-rule" style={{ margin: "20px 0" }} />

                            <span className="eyebrow">Akun</span>
                            {user ? (
                                <>
                                    <button
                                        type="button"
                                        className="drawer-link"
                                        onClick={() => navigate(isAdmin(user) ? "/dashboard" : "/customer/dashboard")}
                                    >
                                        {isAdmin(user) ? "Atelier Studio" : "Dashboard Saya"}
                                    </button>
                                    {!isAdmin(user) && (
                                        <button
                                            type="button"
                                            className="drawer-link"
                                            onClick={() => navigate("/customer/pesanan-saya")}
                                        >
                                            Pesanan Saya
                                        </button>
                                    )}
                                    {!isAdmin(user) && (
                                        <button
                                            type="button"
                                            className="drawer-link"
                                            onClick={() => navigate("/customer/profil")}
                                        >
                                            Profil Saya
                                        </button>
                                    )}
                                    <button type="button" className="drawer-link danger" onClick={handleLogout}>
                                        Keluar
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button type="button" className="drawer-link" onClick={() => navigate("/login")}>
                                        Masuk
                                    </button>
                                    <button type="button" className="drawer-link" onClick={() => navigate("/register")}>
                                        Buat Akun
                                    </button>
                                </>
                            )}
                        </div>

                        <div className="drawer-foot">
                            <ThemeToggle />
                        </div>
                    </aside>
                </div>
            )}

            {/* ── CART DRAWER ── */}
            {cartOpen && (
                <div className="drawer-backdrop" onClick={() => setCartOpen(false)}>
                    <aside className="drawer drawer-right" onClick={(e) => e.stopPropagation()} aria-label="Keranjang belanja">
                        <div className="drawer-head">
                            <div>
                                <span className="eyebrow">Keranjang</span>
                                <h3 style={{ fontSize: 21 }}>{count} item</h3>
                            </div>
                            <button className="icon-btn" onClick={() => setCartOpen(false)} aria-label="Tutup keranjang" type="button">
                                <i className="bi bi-x-lg" aria-hidden="true" />
                            </button>
                        </div>

                        <div className="drawer-body cart-body">
                            {items.length === 0 ? (
                                <div className="cart-empty">
                                    <StickerInline name="leaf" size={54} />
                                    <h4>Keranjangmu masih ringan</h4>
                                    <p>Isi dengan sesuatu yang bikin harimu lebih rapi.</p>
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                        onClick={() => {
                                            setCartOpen(false);
                                            navigate("/customer/produk");
                                        }}
                                    >
                                        Mulai belanja
                                    </button>
                                </div>
                            ) : (
                                items.map((item, idx) => (
                                    <div className="cart-line" key={item.id_produk ?? idx}>
                                        <img
                                            className="cart-line-img"
                                            src={productImage(item, { width: 160, height: 160 })}
                                            onError={handleImageError(item)}
                                            alt={item.nama_produk}
                                            loading="lazy"
                                        />
                                        <div className="cart-line-info">
                                            <div className="cart-line-name">{item.nama_produk}</div>
                                            <div className="cart-line-price">Rp {formatRupiah(item.harga)}</div>
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
                                    </div>
                                ))
                            )}
                        </div>

                        {items.length > 0 && (
                            <div className="drawer-foot cart-foot">
                                <div className="cart-total">
                                    <span>Subtotal</span>
                                    <strong>Rp {formatRupiah(subtotal)}</strong>
                                </div>
                                <p className="caption" style={{ marginBottom: 14 }}>
                                    Ongkir dan promo dihitung di halaman keranjang.
                                </p>
                                <button
                                    type="button"
                                    className="btn btn-primary btn-block"
                                    onClick={() => {
                                        setCartOpen(false);
                                        navigate("/keranjang");
                                    }}
                                >
                                    Lihat keranjang
                                    <i className="bi bi-arrow-right" aria-hidden="true" />
                                </button>
                            </div>
                        )}
                    </aside>
                </div>
            )}

            <div className="toast-container">
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ message: "", type: "info" })}
                />
            </div>
        </>
    );
};

export default CustomerNavbar;
