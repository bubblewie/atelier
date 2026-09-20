/**
 * ATELIER — media helpers.
 *
 * The previous build pointed missing images at `via.placeholder.com`, which no
 * longer resolves and left broken image icons across the app. Everything here
 * is generated locally as a data-URI so placeholders are stable, offline-safe
 * and on-palette.
 */

/**
 * Base URL backend.
 *
 * Diambil dari VITE_API_BASE_URL bila ada, jadi host tidak terkunci ke
 * 127.0.0.1 saat project dijalankan dari mesin lain. Kalau variabel itu
 * tidak diset, jatuh ke default lama supaya perilaku existing tidak berubah.
 *
 * Buat file `.env` di root frontend untuk menggantinya:
 *   VITE_API_BASE_URL=http://192.168.1.10:8000
 */
export const BACKEND_URL = (
    import.meta.env?.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

export const STORAGE_URL = `${BACKEND_URL}/storage`;

/**
 * Bangun URL penuh untuk foto produk, atau `null` bila kosong.
 *
 * Backward-compatible terhadap semua format yang mungkin tersimpan di
 * kolom `foto_produk` sepanjang umur project:
 *
 *   products/abc.jpg          → format standar saat ini
 *   /products/abc.jpg         → ada garis miring di depan
 *   storage/products/abc.jpg  → data lama yang sudah menyertakan "storage"
 *   /storage/products/abc.jpg → idem, dengan garis miring
 *   abc.jpg                   → nama file polos tanpa folder
 *   http://... / https://...  → URL absolut, dipakai apa adanya
 *
 * Tidak ada data database yang perlu diubah — normalisasi dilakukan di sini.
 */
export const storageUrl = (path) => {
    if (!path) return null;

    const raw = String(path).trim();
    if (!raw) return null;

    // URL absolut dibiarkan utuh.
    if (/^https?:\/\//i.test(raw)) return raw;

    // Buang garis miring depan dan awalan "storage/" bila sudah ada,
    // supaya tidak pernah terbentuk ".../storage/storage/...".
    let rel = raw.replace(/^\/+/, "").replace(/^storage\//i, "");

    // Nama file polos tanpa folder dianggap berada di products/.
    if (!rel.includes("/")) rel = `products/${rel}`;

    return `${STORAGE_URL}/${rel}`;
};

const PALETTES = [
    { bg: "#D5EBE4", ink: "#4A8877", dot: "#FFD3D4" },
    { bg: "#F8F4E8", ink: "#775C56", dot: "#D5EBE4" },
    { bg: "#FFF1F1", ink: "#A08A84", dot: "#D5EBE4" },
    { bg: "#E7F5F0", ink: "#64A794", dot: "#F8F4E8" },
];

/** Deterministic palette pick so the same product always gets the same tone. */
const pickPalette = (seed) => {
    const key = String(seed ?? "atelier");
    let sum = 0;
    for (let i = 0; i < key.length; i += 1) sum += key.charCodeAt(i);
    return PALETTES[sum % PALETTES.length];
};

/**
 * An elegant on-brand placeholder: soft field, dotted frame and a small mark.
 * @param {object} opts { width, height, label, seed }
 */
export const placeholderImage = ({ width = 600, height = 700, label = "ATELIER", seed = "" } = {}) => {
    const p = pickPalette(seed || label);
    const cx = width / 2;
    const cy = height / 2;
    const r = Math.min(width, height) * 0.13;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${p.bg}"/>
  <rect x="16" y="16" width="${width - 32}" height="${height - 32}" rx="24" fill="none" stroke="${p.ink}" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="9 10"/>
  <circle cx="${cx}" cy="${cy - r * 0.35}" r="${r}" fill="none" stroke="${p.ink}" stroke-opacity="0.5" stroke-width="3"/>
  <circle cx="${cx + r * 0.75}" cy="${cy - r * 1.1}" r="${r * 0.28}" fill="${p.dot}"/>
  <text x="${cx}" y="${cy + r * 1.5}" text-anchor="middle" font-family="Quicksand, Outfit, sans-serif" font-size="${Math.max(12, Math.round(width * 0.045))}" font-weight="600" letter-spacing="4" fill="${p.ink}" fill-opacity="0.75">${label}</text>
</svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

/** Resolve a product photo with a graceful, on-brand fallback. */
export const productImage = (item, opts = {}) =>
    storageUrl(item?.foto_produk) ||
    placeholderImage({ seed: item?.id_produk ?? item?.nama_produk, label: "ATELIER", ...opts });

/** Editorial background art for hero / collection blocks. */
export const editorialArt = (seed, { width = 800, height = 900, label = "ATELIER" } = {}) =>
    placeholderImage({ width, height, label, seed });

/** Format an integer amount as Indonesian rupiah digits (no currency prefix). */
export const formatRupiah = (value) => Number(value || 0).toLocaleString("id-ID");

/**
 * Handler `onError` untuk setiap <img> produk.
 *
 * `productImage()` sudah memberi placeholder ketika `foto_produk` KOSONG,
 * tetapi tidak bisa tahu kalau nilainya terisi sementara filenya sudah
 * tidak ada di `storage/app/public` — browser baru menyadarinya saat
 * memuat. Itulah yang terjadi pada produk "Penggaris": kolomnya berisi
 * path, filenya hilang, jadi yang tampil ikon rusak dan teks alt.
 *
 * Handler ini menukar sumbernya ke placeholder on-brand begitu pemuatan
 * gagal, sekali saja (flag `dataset.fallback` mencegah loop tak berujung
 * seandainya placeholder pun gagal).
 *
 * Pemakaian:
 *   <img src={productImage(item)} onError={handleImageError(item)} ... />
 */
export const handleImageError = (item, opts = {}) => (event) => {
    const el = event.currentTarget;
    if (el.dataset.fallback === "1") return;

    el.dataset.fallback = "1";
    el.src = placeholderImage({
        seed: item?.id_produk ?? item?.nama_produk ?? "atelier",
        label: "ATELIER",
        ...opts,
    });
};
