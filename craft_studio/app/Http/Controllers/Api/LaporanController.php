<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pesanan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * =====================================================
 * LAPORAN PENJUALAN — ADMIN ONLY
 * =====================================================
 * Endpoint tunggal untuk seluruh mode laporan (harian,
 * mingguan, bulanan, custom range). Periodenya cukup
 * dikirim sebagai rentang tanggal, jadi tidak perlu
 * endpoint terpisah per mode.
 *
 * PERFORMA
 * Ringkasan, tren harian, dan produk terlaris dihitung
 * dengan SUM/COUNT/GROUP BY di database — bukan dengan
 * menarik ribuan baris ke frontend. Daftar transaksi
 * dibatasi dan dipaginasi.
 *
 * INTEGRITAS DATA
 * Pendapatan produk memakai `subtotal` dan `harga_satuan`
 * dari tbl_pesanan_detail, yaitu harga SAAT transaksi —
 * bukan `tbl_produk.harga` yang bisa berubah sewaktu-waktu.
 *
 * TIDAK ADA MIGRATION untuk fitur ini. Seluruh angka
 * berasal dari tabel yang sudah ada.
 * =====================================================
 */
class LaporanController extends Controller
{
    /** Status pembayaran yang dianggap menghasilkan pendapatan. */
    private const STATUS_LUNAS = 'lunas';

    /* ============================================================
       GET /api/laporan
       ------------------------------------------------------------
       Query:
         start   YYYY-MM-DD  (wajib)
         end     YYYY-MM-DD  (wajib)
         status_pembayaran   opsional
         status_pengiriman   opsional
         metode_pembayaran   opsional
         search              opsional (nama/email customer, kode transaksi)
         page, per_page      opsional (default 1, 25)
       ============================================================ */
    public function index(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'start'             => ['required', 'date'],
                'end'               => ['required', 'date', 'after_or_equal:start'],
                'status_pembayaran' => ['nullable', 'string'],
                'status_pengiriman' => ['nullable', 'string'],
                'metode_pembayaran' => ['nullable', 'string'],
                'search'            => ['nullable', 'string', 'max:120'],
                'page'              => ['nullable', 'integer', 'min:1'],
                'per_page'          => ['nullable', 'integer', 'min:5', 'max:200'],
            ]);

            $start = $validated['start'] . ' 00:00:00';
            $end   = $validated['end'] . ' 23:59:59';

            // ---------------------------------------------------------
            // Query dasar — dipakai ulang oleh setiap agregasi.
            // ---------------------------------------------------------
            $filter = function ($query) use ($validated, $start, $end) {

                $query->whereBetween('tbl_pesanan.created_at', [$start, $end]);

                if (!empty($validated['status_pembayaran'])) {
                    $query->where('tbl_pesanan.status_pembayaran', $validated['status_pembayaran']);
                }

                if (!empty($validated['status_pengiriman'])) {
                    $query->where('tbl_pesanan.status_pengiriman', $validated['status_pengiriman']);
                }

                if (!empty($validated['metode_pembayaran'])) {
                    $query->where('tbl_pesanan.metode_pembayaran', $validated['metode_pembayaran']);
                }

                if (!empty($validated['search'])) {
                    $cari = $validated['search'];
                    $query->where(function ($q) use ($cari) {
                        $q->where('tbl_pesanan.kode_transaksi', 'like', "%{$cari}%")
                          ->orWhereHas('user', function ($u) use ($cari) {
                              $u->where('nama', 'like', "%{$cari}%")
                                ->orWhere('email', 'like', "%{$cari}%");
                          });
                    });
                }

                return $query;
            };

            // ---------------------------------------------------------
            // 1. RINGKASAN — satu query agregat
            // ---------------------------------------------------------
            $ringkasan = $filter(Pesanan::query())
                ->selectRaw('COUNT(*) as total_order')
                ->selectRaw('COALESCE(SUM(total_harga), 0) as nilai_semua')
                ->selectRaw("COALESCE(SUM(CASE WHEN status_pembayaran = ? THEN total_harga ELSE 0 END), 0) as pendapatan", [self::STATUS_LUNAS])
                ->selectRaw("SUM(CASE WHEN status_pembayaran = 'lunas' THEN 1 ELSE 0 END) as lunas")
                ->selectRaw("SUM(CASE WHEN status_pembayaran = 'pending' THEN 1 ELSE 0 END) as pending")
                ->selectRaw("SUM(CASE WHEN status_pembayaran = 'menunggu_verifikasi' THEN 1 ELSE 0 END) as menunggu_verifikasi")
                ->selectRaw("SUM(CASE WHEN status_pembayaran = 'gagal' THEN 1 ELSE 0 END) as gagal")
                ->selectRaw("SUM(CASE WHEN status_pengiriman = 'dibatalkan' THEN 1 ELSE 0 END) as dibatalkan")
                ->selectRaw('COUNT(DISTINCT id_user) as jumlah_customer')
                ->first();

            $totalOrder  = (int) ($ringkasan->total_order ?? 0);
            $pendapatan  = (float) ($ringkasan->pendapatan ?? 0);
            $lunasCount  = (int) ($ringkasan->lunas ?? 0);

            // ---------------------------------------------------------
            // 2. PRODUK TERJUAL — dari detail, harga saat transaksi
            // ---------------------------------------------------------
            $detailQuery = DB::table('tbl_pesanan_detail')
                ->join('tbl_pesanan', 'tbl_pesanan.id_pesanan', '=', 'tbl_pesanan_detail.id_pesanan')
                ->whereBetween('tbl_pesanan.created_at', [$start, $end]);

            if (!empty($validated['status_pembayaran'])) {
                $detailQuery->where('tbl_pesanan.status_pembayaran', $validated['status_pembayaran']);
            }
            if (!empty($validated['metode_pembayaran'])) {
                $detailQuery->where('tbl_pesanan.metode_pembayaran', $validated['metode_pembayaran']);
            }

            $produkTerjual = (int) (clone $detailQuery)->sum('tbl_pesanan_detail.jumlah');

            $topProduk = (clone $detailQuery)
                ->leftJoin('tbl_produk', 'tbl_produk.id_produk', '=', 'tbl_pesanan_detail.id_produk')
                ->groupBy('tbl_pesanan_detail.id_produk', 'tbl_produk.nama_produk')
                ->selectRaw('tbl_pesanan_detail.id_produk')
                /*
                 * Kutip TUNGGAL, bukan ganda.
                 *
                 * Dengan sql_mode ANSI_QUOTES aktif, MySQL memperlakukan
                 * "Produk #" sebagai NAMA KOLOM, bukan string — query gagal
                 * dan /laporan balas 500. Kutip tunggal selalu berarti string
                 * di semua sql_mode, jadi aman di konfigurasi mana pun.
                 *
                 * Nilai literalnya dikirim sebagai binding agar tidak ada
                 * string yang disusun langsung ke dalam SQL.
                 */
                ->selectRaw(
                    'COALESCE(tbl_produk.nama_produk, CONCAT(?, tbl_pesanan_detail.id_produk)) as nama_produk',
                    ['Produk #']
                )
                ->selectRaw('SUM(tbl_pesanan_detail.jumlah) as qty')
                ->selectRaw('SUM(tbl_pesanan_detail.subtotal) as pendapatan')
                ->orderByDesc('qty')
                ->limit(10)
                ->get();

            // ---------------------------------------------------------
            // 3. TREN HARIAN — GROUP BY tanggal
            // ---------------------------------------------------------
            $harian = $filter(Pesanan::query())
                ->selectRaw('DATE(tbl_pesanan.created_at) as tanggal')
                ->selectRaw('COUNT(*) as jumlah_order')
                ->selectRaw("COALESCE(SUM(CASE WHEN status_pembayaran = ? THEN total_harga ELSE 0 END), 0) as pendapatan", [self::STATUS_LUNAS])
                ->groupBy('tanggal')
                ->orderBy('tanggal')
                ->get();

            // ---------------------------------------------------------
            // 4. KOMPOSISI METODE PEMBAYARAN
            // ---------------------------------------------------------
            $metode = $filter(Pesanan::query())
                ->selectRaw('metode_pembayaran')
                ->selectRaw('COUNT(*) as jumlah')
                ->selectRaw('COALESCE(SUM(total_harga), 0) as nilai')
                ->groupBy('metode_pembayaran')
                ->get();

            // ---------------------------------------------------------
            // 5. DAFTAR TRANSAKSI — dipaginasi
            // ---------------------------------------------------------
            $perPage = (int) ($validated['per_page'] ?? 25);

            $transaksi = $filter(Pesanan::with(['user', 'detail.produk']))
                ->orderByDesc('tbl_pesanan.created_at')
                ->paginate($perPage, ['*'], 'page', (int) ($validated['page'] ?? 1));

            return response()->json([
                'status'  => 'success',
                'message' => 'Laporan berhasil dihitung',
                'data'    => [
                    'periode' => [
                        'start' => $validated['start'],
                        'end'   => $validated['end'],
                    ],

                    'ringkasan' => [
                        'total_order'          => $totalOrder,
                        'nilai_semua_order'    => (float) ($ringkasan->nilai_semua ?? 0),
                        'pendapatan'           => $pendapatan,
                        'lunas'                => $lunasCount,
                        'pending'              => (int) ($ringkasan->pending ?? 0),
                        'menunggu_verifikasi'  => (int) ($ringkasan->menunggu_verifikasi ?? 0),
                        'gagal'                => (int) ($ringkasan->gagal ?? 0),
                        'dibatalkan'           => (int) ($ringkasan->dibatalkan ?? 0),
                        'produk_terjual'       => $produkTerjual,
                        'jumlah_customer'      => (int) ($ringkasan->jumlah_customer ?? 0),

                        // Rata-rata nilai order dihitung dari order yang benar-benar
                        // menghasilkan uang. Kalau belum ada yang lunas, nilainya null
                        // supaya UI bisa menampilkan "—" alih-alih Rp0 yang menyesatkan.
                        'rata_rata_order'      => $lunasCount > 0
                            ? round($pendapatan / $lunasCount, 2)
                            : null,
                    ],

                    'harian'        => $harian,
                    'top_produk'    => $topProduk,
                    'metode'        => $metode,

                    'transaksi'     => $transaksi->items(),
                    'pagination'    => [
                        'current_page' => $transaksi->currentPage(),
                        'last_page'    => $transaksi->lastPage(),
                        'per_page'     => $transaksi->perPage(),
                        'total'        => $transaksi->total(),
                    ],
                ],
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Parameter laporan tidak valid',
                'errors'  => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal menghitung laporan',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /* ============================================================
       GET /api/laporan/export
       ------------------------------------------------------------
       Mengembalikan SELURUH transaksi pada periode (tanpa
       pagination) untuk keperluan export Excel dan cetak.
       Dibatasi 5000 baris agar tidak membebani memori.
       ============================================================ */
    public function export(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'start'             => ['required', 'date'],
                'end'               => ['required', 'date', 'after_or_equal:start'],
                'status_pembayaran' => ['nullable', 'string'],
                'status_pengiriman' => ['nullable', 'string'],
                'metode_pembayaran' => ['nullable', 'string'],
                'search'            => ['nullable', 'string', 'max:120'],
            ]);

            $query = Pesanan::with(['user', 'detail.produk'])
                ->whereBetween('tbl_pesanan.created_at', [
                    $validated['start'] . ' 00:00:00',
                    $validated['end'] . ' 23:59:59',
                ]);

            foreach (['status_pembayaran', 'status_pengiriman', 'metode_pembayaran'] as $kolom) {
                if (!empty($validated[$kolom])) {
                    $query->where($kolom, $validated[$kolom]);
                }
            }

            if (!empty($validated['search'])) {
                $cari = $validated['search'];
                $query->where(function ($q) use ($cari) {
                    $q->where('kode_transaksi', 'like', "%{$cari}%")
                      ->orWhereHas('user', function ($u) use ($cari) {
                          $u->where('nama', 'like', "%{$cari}%")
                            ->orWhere('email', 'like', "%{$cari}%");
                      });
                });
            }

            $data = $query->orderByDesc('created_at')->limit(5000)->get();

            return response()->json([
                'status'  => 'success',
                'message' => 'Data export berhasil diambil',
                'data'    => $data,
                'meta'    => [
                    'total'    => $data->count(),
                    'terpotong' => $data->count() >= 5000,
                ],
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Parameter export tidak valid',
                'errors'  => $e->errors(),
            ], 422);
        }
    }
}
