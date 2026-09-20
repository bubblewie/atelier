import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import CustomerNavbar from "../components/CustomerNavbar";
import CustomerFooter from "../components/CustomerFooter";
import ProductCard from "../components/common/ProductCard";
import Sticker, { StickerInline } from "../components/common/Sticker";
import Character from "../components/common/Character";
import { ProductSkeletonGrid } from "../components/ui/Skeleton";
import Toast from "../components/ui/Toast";
import EmptyState from "../components/common/EmptyState";
import { editorialArt, productImage, formatRupiah, handleImageError } from "../components/common/media";
import { addToCart, getUser } from "../lib/store";
import "./HomePage.css";


const STORY = [
    {
        sticker: "pen",
        title: "Dipilih satu per satu",
        text: "Setiap item lewat uji tulis, uji lipat, dan uji pakai sebelum masuk katalog.",
    },
    {
        sticker: "leaf",
        title: "Kemasan yang ramah",
        text: "Kertas daur ulang, tanpa plastik berlebih, tetap rapi sampai di tanganmu.",
    },
    {
        sticker: "heart",
        title: "Dikemas dengan tangan",
        text: "Kartu ucapan kecil ikut di setiap paket — gratis, selalu.",
    },
];

const HomePage = () => {
    const navigate = useNavigate();

    const [produk, setProduk] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [activeTab, setActiveTab] = useState("Semua");
    const [email, setEmail] = useState("");
    const [toast, setToast] = useState({ message: "", type: "success" });

    const user = getUser();

    const showToast = useCallback((message, type = "success") => {
        setToast({ message, type });
        window.setTimeout(() => setToast({ message: "", type }), 3200);
    }, []);

    const fetchProduk = useCallback(async () => {
        try {
            setLoading(true);
            setLoadError("");
            const response = await api.get(`/produk`);
            setProduk(response.data?.data || []);
        } catch (error) {
            console.error("Gagal mengambil produk:", error);
            setProduk([]);
            setLoadError("Katalog belum bisa dimuat. Periksa koneksi ke server lalu coba lagi.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProduk();
    }, [fetchProduk]);

    const categories = useMemo(
        () => ["Semua", ...new Set(produk.map((p) => p.kategori?.nama_kategori).filter(Boolean))],
        [produk]
    );

    const tabbed = useMemo(
        () =>
            activeTab === "Semua"
                ? produk
                : produk.filter((p) => p.kategori?.nama_kategori === activeTab),
        [produk, activeTab]
    );

    const featured = produk.slice(0, 4);

    /** Produk pertama yang benar-benar punya foto — dipakai sebagai visual hero. */
    const heroProduk = useMemo(
        () => produk.find((p) => p.foto_produk) || produk[0] || null,
        [produk]
    );
    const spotlight = produk[0];

    const collections = useMemo(() => {
        const named = categories.filter((c) => c !== "Semua").slice(0, 3);
        const fallback = ["Meja Kerja", "Catatan Harian", "Hal-hal Kecil"];
        const labels = named.length ? named : fallback;

        return labels.map((label, i) => {
            const sample = produk.find((p) => p.kategori?.nama_kategori === label);
            return {
                label,
                caption: ["Pilihan untuk meja kerjamu", "Untuk mencatat apa saja", "Detail kecil yang menyenangkan"][i] || "Koleksi Atelier",
                image: sample ? productImage(sample, { width: 700, height: 800 }) : editorialArt(label, { label: label.toUpperCase() }),
                kategori: named.length ? label : null,
            };
        });
    }, [categories, produk]);

    const handleAdd = (item) => {
        const result = addToCart(item);
        if (!result.ok) {
            showToast(
                result.stok > 0 ? `Stok ${item.nama_produk} tinggal ${result.stok}` : `${item.nama_produk} sedang habis`,
                "warning"
            );
            return;
        }
        showToast(`${item.nama_produk} masuk keranjang`, "success");
    };

    const handleNewsletter = (e) => {
        e.preventDefault();
        if (!email.trim()) return;
        showToast("Terima kasih! Kami akan mengabari kamu.", "success");
        setEmail("");
    };

    return (
        <div className="page-shell">
            <CustomerNavbar />

            <main>
                {/* ══════════════════════ HERO ══════════════════════ */}
                <section className="hero">
                    <div className="atelier-container hero-grid">
                        <div className="hero-copy fade-up">
                            <span className="eyebrow">Atelier Studio · Est. 2026</span>
                            <h1 className="display-xl hero-title">
                                Hal kecil,
                                <br />
                                dibuat dengan rapi.
                            </h1>
                            <p className="lede hero-lede">
                                Alat tulis pilihan, jurnal bertekstur, dan perlengkapan studio yang bikin
                                kebiasaan mencatat terasa menyenangkan lagi.
                            </p>

                            <div className="hero-actions">
                                <button className="btn btn-primary btn-lg" onClick={() => navigate("/customer/produk")}>
                                    Lihat koleksi
                                    <i className="bi bi-arrow-right" aria-hidden="true" />
                                </button>
                                <button className="btn btn-outline btn-lg" onClick={() => navigate("/register")}>
                                    Gabung Atelier Club
                                </button>
                            </div>

                            <ul className="hero-facts">
                                <li>
                                    <StickerInline name="sparkle" size={16} /> Gratis ongkir di atas Rp300.000
                                </li>
                                <li>
                                    <StickerInline name="sparkle" size={16} /> Dikemas ulang dengan tangan
                                </li>
                            </ul>
                        </div>

                        <div className="hero-visual fade-up d-2">
                            <Sticker name="ring" size={104} rotate={-10} float style={{ top: -34, left: -26, opacity: 0.55 }} />
                            <Sticker name="star" size={46} rotate={14} float style={{ top: 26, right: -14 }} />
                            <Sticker name="bow" size={54} rotate={-8} style={{ bottom: 74, left: -30 }} />
                            <Sticker name="leaf" size={44} rotate={18} float style={{ bottom: -14, right: 42 }} />

                            {/* Visual hero memakai foto produk asli dari katalog.
                                Aset hero.png bawaan template Vite dibuang: itu
                                gambar kotak 3D ungu 343x361px di latar hitam —
                                bukan aset Atelier, dan pecah saat diregangkan. */}
                            <figure className="frame-photo hero-photo tilt-r">
                                <img
                                    src={
                                        heroProduk
                                            ? productImage(heroProduk, { width: 900, height: 760 })
                                            : editorialArt("hero", { width: 900, height: 760, label: "ATELIER" })
                                    }
                                    onError={handleImageError(heroProduk || {})}
                                    alt={
                                        heroProduk
                                            ? `${heroProduk.nama_produk} dari koleksi Atelier`
                                            : "Koleksi alat tulis Atelier"
                                    }
                                />
                            </figure>

                            {spotlight ? (
                                <button
                                    type="button"
                                    className="hero-chip"
                                    onClick={() => navigate("/customer/produk")}
                                >
                                    <img src={productImage(spotlight, { width: 140, height: 140 })}
                                            onError={handleImageError(spotlight)} alt="" />
                                    <span>
                                        <span className="hero-chip-label">Sedang disukai</span>
                                        <span className="hero-chip-name">{spotlight.nama_produk}</span>
                                        <span className="hero-chip-price">Rp {formatRupiah(spotlight.harga)}</span>
                                    </span>
                                </button>
                            ) : (
                                <span className="tape-label hero-tape">
                                    <StickerInline name="sparkle" size={14} /> Koleksi baru tiap Jumat
                                </span>
                            )}
                        </div>

                        {/* Karakter Atelier — dekoratif, di belakang CTA.
                            Di layar <=980px lapisan ini berhenti absolute dan
                            turun jadi barisnya sendiri (lihat Character.css),
                            jadi tidak pernah menutupi tombol atau teks. */}
                        <div className="hero-characters" aria-hidden="true">
                            <div className="hero-char hero-char-1">
                                <Character id={1} size={218} rotate={-3} float />
                            </div>
                            <div className="hero-char hero-char-2">
                                <Character id={2} size={132} rotate={4} float className="delay-1" />
                            </div>
                            <div className="hero-char hero-char-3">
                                <Character id={3} size={186} rotate={3} float className="delay-2" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ══════════════════════ MARQUEE STRIP ══════════════════════ */}
                <div className="strip" aria-hidden="true">
                    <div className="strip-track">
                        {Array.from({ length: 2 }).map((_, dup) => (
                            <span key={dup} className="strip-group">
                                {["Stationery pilihan", "Jurnal bertekstur", "Stiker & washi", "Kemasan ramah", "Kartu ucapan gratis"].map(
                                    (word) => (
                                        <span key={word} className="strip-word">
                                            {word}
                                            <StickerInline name="dot" size={11} />
                                        </span>
                                    )
                                )}
                            </span>
                        ))}
                    </div>
                </div>

                {/* ══════════════════════ COLLECTIONS ══════════════════════ */}
                <section className="section surface-cream">
                    <div className="atelier-container">
                        <div className="section-head center">
                            <span className="eyebrow">Jelajahi</span>
                            <h2>Koleksi pilihan</h2>
                            <p className="lede">Tiga cara berbeda untuk mulai menata mejamu.</p>
                        </div>

                        <div className="collection-grid">
                            {collections.map((c, i) => (
                                <button
                                    key={c.label}
                                    type="button"
                                    className={`collection-card fade-up d-${i + 1}`}
                                    onClick={() =>
                                        navigate("/customer/produk", c.kategori ? { state: { kategori: c.kategori } } : undefined)
                                    }
                                >
                                    <img src={c.image} alt={c.label} loading="lazy" />
                                    <span className="collection-overlay">
                                        <span className="collection-name">{c.label}</span>
                                        <span className="collection-caption">{c.caption}</span>
                                        <span className="collection-cta">
                                            Lihat <i className="bi bi-arrow-right" aria-hidden="true" />
                                        </span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══════════════════════ FEATURED PRODUCTS ══════════════════════ */}
                <section className="section">
                    <div className="atelier-container">
                        <div className="row-between" style={{ marginBottom: 36 }}>
                            <div>
                                <span className="eyebrow">Favorit</span>
                                <h2 style={{ marginTop: 8 }}>Paling sering dibawa pulang</h2>
                            </div>
                            <button className="btn btn-mint" onClick={() => navigate("/customer/produk")}>
                                Semua produk
                                <i className="bi bi-arrow-right" aria-hidden="true" />
                            </button>
                        </div>

                        {loading ? (
                            <ProductSkeletonGrid count={4} />
                        ) : loadError ? (
                            <EmptyState
                                tone="error"
                                title="Katalog belum termuat"
                                description={loadError}
                                action={
                                    <button className="btn btn-primary" onClick={fetchProduk}>
                                        Coba lagi
                                    </button>
                                }
                            />
                        ) : featured.length === 0 ? (
                            <EmptyState
                                title="Belum ada produk"
                                description="Katalog Atelier masih kosong. Produk akan muncul di sini setelah ditambahkan."
                            />
                        ) : (
                            <div className="product-grid">
                                {featured.map((item) => (
                                    <ProductCard
                                        key={item.id_produk}
                                        item={item}
                                        onAddToCart={handleAdd}
                                        onClick={() => navigate(`/produk/${item.id_produk}`)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* ══════════════════════ STORY / EDITORIAL SPLIT ══════════════════════ */}
                <section className="section surface-mint story">
                    <div className="atelier-container story-grid">
                        <div className="story-visual">
                            <Sticker name="tape" size={82} rotate={-4} style={{ top: -22, left: 30, zIndex: 4 }} />
                            <figure className="frame-photo tilt-l story-photo-a">
                                <img
                                    src={
                                        produk[1]
                                            ? productImage(produk[1], { width: 640, height: 760 })
                                            : editorialArt("story-a", { width: 640, height: 760, label: "STUDIO" })
                                    }
                                    alt="Detail produk Atelier"
                                    loading="lazy"
                                />
                            </figure>
                            <figure className="frame-photo tilt-r story-photo-b">
                                <img
                                    src={
                                        produk[2]
                                            ? productImage(produk[2], { width: 480, height: 480 })
                                            : editorialArt("story-b", { width: 480, height: 480, label: "ATELIER" })
                                    }
                                    alt="Detail kemasan Atelier"
                                    loading="lazy"
                                />
                            </figure>
                        </div>

                        <div className="story-copy">
                            <span className="eyebrow">Cerita kami</span>
                            <h2 className="display-l" style={{ margin: "12px 0 18px" }}>
                                Setiap benda punya alasan untuk ada di meja.
                            </h2>
                            <p className="lede" style={{ marginBottom: 30 }}>
                                Atelier dimulai dari satu kebiasaan sederhana: menulis ulang rencana setiap pagi.
                                Yang kami jual adalah alat yang membuat kebiasaan itu bertahan.
                            </p>

                            <ul className="story-list">
                                {STORY.map((s) => (
                                    <li key={s.title}>
                                        <span className="story-icon">
                                            <StickerInline name={s.sticker} size={26} />
                                        </span>
                                        <span>
                                            <strong>{s.title}</strong>
                                            <span>{s.text}</span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* ══════════════════════ PROMO ══════════════════════ */}
                <section className="section-sm">
                    <div className="atelier-container">
                        <div className="promo">
                            <Sticker name="sparkle" size={40} rotate={-12} float style={{ top: 26, left: 28 }} />
                            <Sticker name="heart" size={36} rotate={12} style={{ bottom: 26, left: 78 }} />
                            <Sticker name="star" size={44} rotate={-6} float style={{ top: 34, right: 46 }} />

                            <div className="promo-copy">
                                <span className="tape-label">Penawaran bulan ini</span>
                                <h2 className="display-l" style={{ margin: "18px 0 14px" }}>
                                    Hal kecil, lebih baik bersama.
                                </h2>
                                <p className="lede" style={{ marginBottom: 26 }}>
                                    Dapatkan pouch linen Atelier dan satu lembar stiker untuk setiap pesanan
                                    di atas Rp300.000.
                                </p>
                                <button className="btn btn-primary btn-lg" onClick={() => navigate("/customer/produk")}>
                                    Belanja sekarang
                                    <i className="bi bi-arrow-right" aria-hidden="true" />
                                </button>
                            </div>

                            <div className="promo-visual">
                                <figure className="frame-photo">
                                    <img
                                        src={
                                            produk[3]
                                                ? productImage(produk[3], { width: 640, height: 640 })
                                                : editorialArt("promo", { width: 640, height: 640, label: "GIFT SET" })
                                        }
                                        alt="Paket hadiah Atelier"
                                        loading="lazy"
                                    />
                                </figure>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ══════════════════════ NEW ARRIVALS ══════════════════════ */}
                <section className="section">
                    <div className="atelier-container">
                        <div className="section-head center">
                            <span className="eyebrow">Baru datang</span>
                            <h2>Segar dari studio</h2>
                            <p className="lede">Pilih kategori untuk mempersempit tampilan.</p>
                        </div>

                        {categories.length > 1 && (
                            <div className="tab-row" role="tablist" aria-label="Filter kategori">
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        role="tab"
                                        aria-selected={activeTab === cat}
                                        className={`tab-pill ${activeTab === cat ? "active" : ""}`}
                                        onClick={() => setActiveTab(cat)}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        )}

                        {loading ? (
                            <ProductSkeletonGrid count={8} />
                        ) : tabbed.length === 0 ? (
                            <EmptyState
                                title="Belum ada produk di kategori ini"
                                description="Coba pilih kategori lain atau lihat seluruh katalog."
                                action={
                                    <button className="btn btn-primary" onClick={() => setActiveTab("Semua")}>
                                        Tampilkan semua
                                    </button>
                                }
                            />
                        ) : (
                            <div className="product-grid">
                                {tabbed.slice(0, 8).map((item) => (
                                    <ProductCard
                                        key={item.id_produk}
                                        item={item}
                                        onAddToCart={handleAdd}
                                        onClick={() => navigate(`/produk/${item.id_produk}`)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* ══════════════════════ CLUB CTA ══════════════════════ */}
                <section className="section-sm">
                    <div className="atelier-container">
                        <div className="club">
                            <Sticker name="flower" size={58} rotate={-14} float style={{ top: -20, left: 40 }} />
                            <Sticker name="sparkle" size={34} rotate={10} style={{ bottom: 28, right: 60 }} />

                            <span className="eyebrow">Keanggotaan</span>
                            <h2 className="display-l" style={{ margin: "12px 0 12px" }}>
                                Atelier Club
                            </h2>
                            <p className="lede" style={{ maxWidth: 520, margin: "0 auto 28px" }}>
                                Buat akun untuk menyimpan riwayat pesanan, melacak status pengiriman,
                                dan checkout lebih cepat.
                            </p>

                            <ul className="club-perks">
                                <li>
                                    <StickerInline name="sparkle" size={15} /> Riwayat pesanan tersimpan
                                </li>
                                <li>
                                    <StickerInline name="sparkle" size={15} /> Lacak status pengiriman
                                </li>
                                <li>
                                    <StickerInline name="sparkle" size={15} /> Checkout lebih cepat
                                </li>
                            </ul>

                            <button
                                className="btn btn-primary btn-lg"
                                onClick={() => navigate(user ? "/customer/dashboard" : "/register")}
                            >
                                {user ? "Buka dashboard saya" : "Daftar gratis"}
                                <i className="bi bi-arrow-right" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </section>

                {/* ══════════════════════ NEWSLETTER ══════════════════════ */}
                <section className="newsletter">
                    <div className="atelier-container newsletter-inner">
                        <span className="eyebrow">Surat kabar kecil</span>
                        <h2 style={{ margin: "10px 0 12px" }}>Tetap terhubung.</h2>
                        <p className="lede" style={{ marginBottom: 26 }}>
                            Koleksi baru, penawaran, dan catatan studio — sesekali saja, tidak berisik.
                        </p>

                        <form className="newsletter-form" onSubmit={handleNewsletter}>
                            <label className="form-label" htmlFor="newsletter-email" style={{ position: "absolute", left: -9999 }}>
                                Alamat email
                            </label>
                            <input
                                id="newsletter-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nama@email.com"
                                required
                            />
                            <button type="submit" className="btn btn-primary">
                                Berlangganan
                            </button>
                        </form>
                    </div>
                </section>
            </main>

            <CustomerFooter />

            <div className="toast-container">
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ message: "", type: "success" })}
                />
            </div>
        </div>
    );
};

export default HomePage;
