/**
 * ATELIER — export laporan ke Excel.
 *
 * Memakai SheetJS (`xlsx`), yang menulis file .xlsx BINER sungguhan —
 * bukan CSV atau HTML yang diganti ekstensinya. Hasilnya bisa dibuka
 * Microsoft Excel maupun LibreOffice.
 *
 * Dependency `xlsx` ditambahkan ke package.json, jadi jalankan
 * `npm install` sebelum memakai fitur ini.
 *
 * Seluruh isi workbook berasal dari data API yang dikirim pemanggil.
 * Tidak ada baris contoh yang ditambahkan di sini.
 */
import * as XLSX from "xlsx";
import { orderItems } from "./order";
import { methodLabel, paymentStatus } from "../config/payment";

const NAMA_BULAN = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const tanggalID = (nilai) => {
    if (!nilai) return "";
    const d = new Date(nilai);
    if (Number.isNaN(d.getTime())) return "";
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

/** Lebar kolom otomatis berdasarkan isi terpanjang. */
const autoWidth = (rows) => {
    if (!rows.length) return [];
    const keys = Object.keys(rows[0]);
    return keys.map((k) => ({
        wch: Math.min(
            42,
            Math.max(k.length + 2, ...rows.map((r) => String(r[k] ?? "").length + 2))
        ),
    }));
};

const sheetDari = (rows) => {
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = autoWidth(rows);
    return ws;
};

/**
 * Bangun dan unduh workbook laporan.
 *
 * @param {object}  opts
 * @param {object}  opts.ringkasan  objek ringkasan dari API
 * @param {Array}   opts.transaksi  daftar pesanan (sudah difilter periode)
 * @param {Array}   opts.topProduk  produk terlaris dari API
 * @param {Array}   opts.harian     tren harian dari API
 * @param {object}  opts.periode    { start, end }
 * @param {string}  opts.namaFile   opsional
 */
export function exportLaporanExcel({
    ringkasan = {},
    transaksi = [],
    topProduk = [],
    harian = [],
    periode = {},
    namaFile,
} = {}) {
    const wb = XLSX.utils.book_new();
    const dicetak = new Date();

    /* ---------------------------------------------------- Sheet 1 */
    const ringkasanRows = [
        { Keterangan: "Aplikasi", Nilai: "ATELIER" },
        { Keterangan: "Laporan", Nilai: "Laporan Penjualan" },
        { Keterangan: "Periode", Nilai: `${tanggalID(periode.start)} – ${tanggalID(periode.end)}` },
        { Keterangan: "Tanggal export", Nilai: dicetak.toLocaleString("id-ID") },
        { Keterangan: "", Nilai: "" },
        { Keterangan: "Total pesanan", Nilai: ringkasan.total_order ?? 0 },
        { Keterangan: "Total pendapatan (lunas)", Nilai: ringkasan.pendapatan ?? 0 },
        { Keterangan: "Nilai seluruh pesanan", Nilai: ringkasan.nilai_semua_order ?? 0 },
        { Keterangan: "Pembayaran lunas", Nilai: ringkasan.lunas ?? 0 },
        { Keterangan: "Menunggu verifikasi", Nilai: ringkasan.menunggu_verifikasi ?? 0 },
        { Keterangan: "Belum dibayar", Nilai: ringkasan.pending ?? 0 },
        { Keterangan: "Pembayaran gagal", Nilai: ringkasan.gagal ?? 0 },
        { Keterangan: "Pesanan dibatalkan", Nilai: ringkasan.dibatalkan ?? 0 },
        { Keterangan: "Produk terjual", Nilai: ringkasan.produk_terjual ?? 0 },
        { Keterangan: "Jumlah customer", Nilai: ringkasan.jumlah_customer ?? 0 },
        {
            Keterangan: "Rata-rata nilai order (lunas)",
            // null berarti belum ada order lunas — jangan tulis 0 yang menyesatkan.
            Nilai: ringkasan.rata_rata_order ?? "Belum ada order lunas",
        },
    ];
    XLSX.utils.book_append_sheet(wb, sheetDari(ringkasanRows), "Ringkasan");

    /* ---------------------------------------------------- Sheet 2 */
    const detailRows = [];
    let nomor = 1;

    transaksi.forEach((pesanan) => {
        const items = orderItems(pesanan);
        const status = paymentStatus(pesanan.status_pembayaran).label;
        const pelanggan = pesanan.user?.nama || pesanan.user?.name || `User #${pesanan.id_user}`;

        if (items.length === 0) {
            detailRows.push({
                No: nomor++,
                Tanggal: tanggalID(pesanan.created_at),
                "No Pesanan": pesanan.kode_transaksi || `#${pesanan.id_pesanan}`,
                Customer: pelanggan,
                Produk: "(tidak ada rincian)",
                Qty: 0,
                Harga: 0,
                Subtotal: 0,
                "Metode Pembayaran": methodLabel(pesanan.metode_pembayaran),
                "Status Pembayaran": status,
                "Status Pesanan": pesanan.status_pengiriman || "",
                Total: Number(pesanan.total_harga || 0),
            });
            return;
        }

        items.forEach((item, idx) => {
            detailRows.push({
                No: nomor++,
                Tanggal: tanggalID(pesanan.created_at),
                "No Pesanan": pesanan.kode_transaksi || `#${pesanan.id_pesanan}`,
                Customer: pelanggan,
                Produk: item.nama,
                Qty: item.jumlah,
                // Harga saat transaksi, bukan harga produk saat ini.
                Harga: item.hargaSatuan,
                Subtotal: item.subtotal,
                "Metode Pembayaran": methodLabel(pesanan.metode_pembayaran),
                "Status Pembayaran": status,
                "Status Pesanan": pesanan.status_pengiriman || "",
                // Total pesanan hanya ditulis di baris pertama supaya tidak
                // terhitung berlipat saat kolom ini dijumlahkan di Excel.
                Total: idx === 0 ? Number(pesanan.total_harga || 0) : "",
            });
        });
    });

    XLSX.utils.book_append_sheet(
        wb,
        sheetDari(detailRows.length ? detailRows : [{ Keterangan: "Tidak ada transaksi pada periode ini" }]),
        "Detail Transaksi"
    );

    /* ---------------------------------------------------- Sheet 3 */
    if (topProduk.length) {
        const rows = topProduk.map((p, i) => ({
            No: i + 1,
            Produk: p.nama_produk,
            "Jumlah Terjual": Number(p.qty || 0),
            "Total Pendapatan": Number(p.pendapatan || 0),
        }));
        XLSX.utils.book_append_sheet(wb, sheetDari(rows), "Produk Terlaris");
    }

    /* ---------------------------------------------------- Sheet 4 */
    if (harian.length) {
        const rows = harian.map((h) => ({
            Tanggal: tanggalID(h.tanggal),
            "Jumlah Pesanan": Number(h.jumlah_order || 0),
            Pendapatan: Number(h.pendapatan || 0),
        }));
        XLSX.utils.book_append_sheet(wb, sheetDari(rows), "Ringkasan Harian");
    }

    /* ---------------------------------------------------- Simpan */
    let nama = namaFile;
    if (!nama) {
        const d = periode.start ? new Date(periode.start) : dicetak;
        nama = `ATELIER_Laporan_${NAMA_BULAN[d.getMonth()]}_${d.getFullYear()}.xlsx`;
    }

    XLSX.writeFile(wb, nama);
    return nama;
}

export default exportLaporanExcel;
