/**
 * ATELIER — Konfigurasi tujuan pembayaran.
 *
 * ⚠️  ISI FILE INI DENGAN DATA REKENING ASLI KAMU.
 *
 * Backend `craft_studio` tidak menyimpan data rekening tujuan di mana pun
 * (tidak ada tabel maupun endpoint untuk itu), jadi informasi ini hidup di
 * frontend sebagai konfigurasi.
 *
 * Selama array di bawah masih kosong, halaman instruksi pembayaran akan
 * menampilkan empty state yang jujur — BUKAN nomor rekening karangan.
 *
 * Nilai `metode` harus cocok dengan enum yang divalidasi backend di
 * CheckoutController: 'transfer_bank' | 'ewallet' | 'cod'.
 */

/**
 * ============================================================
 * ⚠️  DATA DI BAWAH ADALAH PLACEHOLDER DEMO
 * ============================================================
 * Tidak ada data rekening di backend, database, maupun .env —
 * sudah dicek dan memang belum pernah ada. Jadi angka di bawah
 * DIBUAT UNTUK KEPERLUAN DEMO, bukan rekening asli, dan tidak
 * boleh dipakai menerima uang sungguhan.
 *
 * `isDemo: true` membuat UI menampilkan label "DEMO" di samping
 * nomornya, supaya penguji tidak salah mengira ini rekening resmi.
 *
 * SEBELUM DIPAKAI SUNGGUHAN:
 * ganti isi array ini dengan rekening asli lalu hapus `isDemo`.
 * Tidak ada secret maupun API key di file ini — aman di-commit.
 * ============================================================
 */

/** Rekening bank tujuan transfer. */
export const BANK_ACCOUNTS = [
    { bank: "BCA", nomor: "0000 1111 2222", atasNama: "Atelier Studio (DEMO)", isDemo: true },
    { bank: "Mandiri", nomor: "0000 3333 4444", atasNama: "Atelier Studio (DEMO)", isDemo: true },
];

/** Akun e-wallet tujuan. */
export const EWALLET_ACCOUNTS = [
    { provider: "GoPay", nomor: "0800 0000 0001", atasNama: "Atelier Studio (DEMO)", isDemo: true },
    { provider: "OVO", nomor: "0800 0000 0002", atasNama: "Atelier Studio (DEMO)", isDemo: true },
];

/** True bila konfigurasi masih memakai placeholder demo. */
export const usingDemoAccounts = () =>
    [...BANK_ACCOUNTS, ...EWALLET_ACCOUNTS].some((a) => a.isDemo);

/** Label metode pembayaran, dipakai di seluruh UI. */
export const PAYMENT_METHOD_LABEL = {
    transfer_bank: "Transfer Bank",
    ewallet: "E-Wallet",
    cod: "Bayar di Tempat (COD)",
};

export const methodLabel = (id) => PAYMENT_METHOD_LABEL[id] || id || "—";

/**
 * Status pembayaran — dipetakan PERSIS dari enum backend.
 * PesananController@update menerima:
 *   pending | menunggu_verifikasi | lunas | gagal
 */
export const PAYMENT_STATUS = {
    pending: {
        label: "Belum Dibayar",
        badge: "badge-warning",
        deskripsi: "Kami menunggu pembayaranmu.",
    },
    menunggu_verifikasi: {
        label: "Menunggu Verifikasi",
        badge: "badge-info",
        deskripsi: "Bukti pembayaranmu sedang diperiksa admin.",
    },
    lunas: {
        label: "Sudah Dibayar",
        badge: "badge-success",
        deskripsi: "Pembayaran terverifikasi. Pesananmu diproses.",
    },
    gagal: {
        label: "Ditolak / Gagal",
        badge: "badge-error",
        deskripsi: "Pembayaran ditolak. Silakan kirim ulang bukti yang benar.",
    },
};

export const paymentStatus = (value) =>
    PAYMENT_STATUS[String(value || "pending").toLowerCase()] || PAYMENT_STATUS.pending;

/** Metode yang membutuhkan bukti transfer. COD tidak. */
export const needsProof = (metode) => metode === "transfer_bank" || metode === "ewallet";

/** Status pengiriman — enum backend: dikemas | dikirim | selesai | dibatalkan. */
export const SHIPPING_STATUS = {
    dikemas: { label: "Dikemas", badge: "badge-mint" },
    dikirim: { label: "Dikirim", badge: "badge-info" },
    selesai: { label: "Selesai", badge: "badge-success" },
    dibatalkan: { label: "Dibatalkan", badge: "badge-error" },
};

export const shippingStatus = (value) =>
    SHIPPING_STATUS[String(value || "dikemas").toLowerCase()] || SHIPPING_STATUS.dikemas;

export const hasPaymentDestination = (metode) => {
    if (metode === "transfer_bank") return BANK_ACCOUNTS.length > 0;
    if (metode === "ewallet") return EWALLET_ACCOUNTS.length > 0;
    return true;
};
