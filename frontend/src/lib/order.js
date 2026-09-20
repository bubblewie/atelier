/**
 * ATELIER — normalisasi baris pesanan.
 *
 * Sumber kebenaran adalah backend:
 *
 *   Pesanan::with(['user', 'detail.produk'])   → relasi bernama `detail`
 *   PesananDetail: id_pesanan, id_produk, jumlah, harga_satuan, subtotal
 *
 * Sebelumnya beberapa halaman membaca `detail_pesanan` atau `items`, yang
 * tidak pernah dikirim API — akibatnya halaman detail pesanan selalu
 * menampilkan "Rincian produk tidak tersedia" padahal datanya ada.
 *
 * Semua halaman sekarang lewat satu fungsi ini supaya tidak terulang.
 */

/** Ambil array baris pesanan apa pun bentuk pembungkusnya. */
export const orderLines = (pesanan) => {
    const raw =
        pesanan?.detail ??
        pesanan?.details ??
        pesanan?.detail_pesanan ??
        pesanan?.items ??
        [];

    return Array.isArray(raw) ? raw : [];
};

/**
 * Ratakan satu baris menjadi bentuk yang dipakai UI.
 * Nama field mengikuti tabel `tbl_detail_pesanan` apa adanya, dengan
 * cadangan seandainya API dibungkus resource lain di kemudian hari.
 */
export const normalizeLine = (line, index = 0) => {
    const jumlah = Number(line?.jumlah ?? line?.qty ?? 0);

    const hargaSatuan = Number(
        line?.harga_satuan ?? line?.harga ?? line?.produk?.harga ?? 0
    );

    const subtotal = Number(line?.subtotal ?? hargaSatuan * jumlah);

    return {
        key: line?.id_detail ?? line?.id_detail_pesanan ?? line?.id ?? `line-${index}`,
        produk: line?.produk ?? null,
        nama: line?.produk?.nama_produk ?? line?.nama_produk ?? `Produk #${line?.id_produk ?? "?"}`,
        jumlah,
        hargaSatuan,
        subtotal,
    };
};

/** Baris pesanan yang sudah siap dirender. */
export const orderItems = (pesanan) => orderLines(pesanan).map(normalizeLine);

/** Jumlah seluruh subtotal — dipakai sebagai fallback bila total_harga kosong. */
export const orderSubtotal = (pesanan) =>
    orderItems(pesanan).reduce((sum, item) => sum + item.subtotal, 0);

/** Total unit produk dalam satu pesanan. */
export const orderQty = (pesanan) =>
    orderItems(pesanan).reduce((sum, item) => sum + item.jumlah, 0);
