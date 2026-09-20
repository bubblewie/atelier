<?php

namespace App\Http\Controllers;

use App\Models\Produk;
use App\Models\Pesanan;
use App\Models\PesananDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CheckoutController extends Controller
{
    /**
     * Proses checkout
     */
    public function checkout(Request $request)
    {
        // ===============================
        // VALIDASI REQUEST
        // ===============================
        // =====================================================
        // PEMILIK PESANAN = USER YANG SEDANG LOGIN
        // =====================================================
        // Route ini berada di grup auth:sanctum, jadi $request->user()
        // dijamin ada. Jangan pernah memakai id_user dari request body.

        $pemilik = $request->user();

        if (!$pemilik) {
            return response()->json([
                'status' => 'error',
                'message' => 'Belum terautentikasi.',
            ], 401);
        }

        $request->validate([
            // `id_user` sengaja TIDAK lagi wajib dan TIDAK dipakai sebagai
            // sumber kebenaran. Frontend lama masih mengirimnya, jadi field ini
            // tetap diterima demi backward compatibility — tapi nilainya
            // diabaikan. Pemilik pesanan selalu diambil dari token Sanctum,
            // supaya Customer A tidak bisa membuat pesanan atas nama Customer B.
            'id_user' => 'sometimes|integer',
            'catatan' => 'nullable|string',

            'metode_pembayaran' => [
                'required',
                'in:transfer_bank,cod,ewallet',
            ],

            'items' => 'required|array|min:1',

            'items.*.id_produk' => [
                'required',
                'exists:tbl_produk,id_produk',
            ],

            'items.*.jumlah' => [
                'required',
                'integer',
                'min:1',
            ],
        ]);

        // ===============================
        // MULAI TRANSACTION
        // ===============================
        DB::beginTransaction();

        try {

            $totalHarga = 0;
            $detailPesanan = [];

            // ===============================
            // CEK PRODUK & STOK
            // ===============================
            foreach ($request->items as $item) {

                $produk = Produk::lockForUpdate()
                    ->findOrFail($item['id_produk']);

                $jumlah = (int) $item['jumlah'];

                // Cek stok
                if ($produk->stok < $jumlah) {
                    throw new \Exception(
                        "Stok produk {$produk->nama_produk} tidak mencukupi. " .
                        "Stok tersedia: {$produk->stok}, " .
                        "jumlah yang diminta: {$jumlah}."
                    );
                }

                // Harga dari database
                $hargaSatuan = (int) $produk->harga;

                // Hitung subtotal
                $subtotal = $hargaSatuan * $jumlah;

                // Tambahkan ke total
                $totalHarga += $subtotal;

                // Simpan sementara
                $detailPesanan[] = [
                    'produk' => $produk,
                    'jumlah' => $jumlah,
                    'harga_satuan' => $hargaSatuan,
                    'subtotal' => $subtotal,
                ];
            }

            // ===============================
            // BUAT KODE TRANSAKSI
            // ===============================
            $kodeTransaksi =
                'TRX-' .
                now()->format('YmdHis') .
                '-' .
                strtoupper(Str::random(4));

            // ===============================
            // BUAT PESANAN
            // ===============================
            $pesanan = Pesanan::create([
                'kode_transaksi' => $kodeTransaksi,
                'id_user' => $pemilik->id_user,
                'tanggal_transaksi' => now(),
                'total_harga' => $totalHarga,
                'status_pembayaran' => 'pending',
                'metode_pembayaran' => $request->metode_pembayaran,
                'status_pengiriman' => 'dikemas',
                'catatan' => $request->catatan,
            ]);

            // ===============================
            // BUAT DETAIL PESANAN
            // + KURANGI STOK
            // ===============================
            foreach ($detailPesanan as $detail) {

                // Buat detail pesanan
                PesananDetail::create([
                    'id_pesanan' => $pesanan->id_pesanan,
                    'id_produk' => $detail['produk']->id_produk,
                    'jumlah' => $detail['jumlah'],
                    'harga_satuan' => $detail['harga_satuan'],
                    'subtotal' => $detail['subtotal'],
                ]);

                // Kurangi stok
                $detail['produk']->decrement(
                    'stok',
                    $detail['jumlah']
                );
            }

            // ===============================
            // COMMIT
            // ===============================
            DB::commit();

            // ===============================
            // RESPONSE
            // ===============================
            return response()->json([
                'status' => 'success',
                'message' => 'Checkout berhasil',

                'data' => [
                    'id_pesanan' => $pesanan->id_pesanan,
                    'kode_transaksi' => $pesanan->kode_transaksi,
                    'tanggal_transaksi' => $pesanan->tanggal_transaksi,
                    'total_harga' => $pesanan->total_harga,
                    'status_pembayaran' => $pesanan->status_pembayaran,
                    'metode_pembayaran' => $pesanan->metode_pembayaran,
                    'status_pengiriman' => $pesanan->status_pengiriman,
                    'catatan' => $pesanan->catatan,
                ],
            ], 201);

        } catch (\Exception $e) {

            // ===============================
            // ROLLBACK
            // ===============================
            DB::rollBack();

            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}