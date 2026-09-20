<?php

namespace App\Http\Controllers;

use App\Models\Pesanan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class PesananController extends Controller
{
    /**
     * =====================================================
     * MENAMPILKAN SEMUA PESANAN
     *
     * GET /api/pesanan
     * =====================================================
     */
    public function index(): JsonResponse
    {
        try {

            $pesanan = Pesanan::with([
                'user',
                'detail.produk'
            ])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'status' => 'success',
                'message' => 'Data pesanan berhasil diambil',
                'data' => $pesanan
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil data pesanan',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * =====================================================
     * MENAMPILKAN RIWAYAT PESANAN USER
     *
     * GET /api/pesanan/user/{id_user}
     *
     * Digunakan untuk menampilkan pesanan milik
     * customer tertentu saja.
     * =====================================================
     */
    public function riwayatUser(Request $request, $id_user): JsonResponse
    {
        try {

            // =============================================
            // OTORISASI
            // Customer hanya boleh melihat riwayatnya sendiri.
            // Tanpa ini, mengganti angka di URL akan membocorkan
            // pesanan milik orang lain.
            // =============================================

            $user = $request->user();

            if ($user->role !== 'admin'
                && (int) $user->id_user !== (int) $id_user) {

                return response()->json([
                    'status' => 'error',
                    'message' => 'Kamu tidak berhak melihat riwayat pesanan ini.'
                ], 403);
            }


            // =============================================
            // AMBIL PESANAN BERDASARKAN ID USER
            // =============================================

            $pesanan = Pesanan::with([
                'user',
                'detail.produk'
            ])
                ->where('id_user', $id_user)
                ->orderBy('created_at', 'desc')
                ->get();


            // =============================================
            // RESPONSE
            // =============================================

            return response()->json([
                'status' => 'success',
                'message' => 'Riwayat pesanan berhasil diambil',
                'data' => $pesanan
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil riwayat pesanan',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * =====================================================
     * MENAMPILKAN SATU PESANAN
     *
     * GET /api/pesanan/{id}
     * =====================================================
     */
    public function show(Request $request, $id): JsonResponse
    {
        try {

            $pesanan = Pesanan::with([
                'user',
                'detail.produk'
            ])
                ->find($id);

            if (!$pesanan) {

                return response()->json([
                    'status' => 'error',
                    'message' => 'Pesanan tidak ditemukan'
                ], 404);
            }

            // =============================================
            // OTORISASI — customer hanya boleh pesanannya sendiri
            // =============================================

            $user = $request->user();

            if ($user->role !== 'admin'
                && (int) $pesanan->id_user !== (int) $user->id_user) {

                return response()->json([
                    'status' => 'error',
                    'message' => 'Kamu tidak berhak melihat pesanan ini.'
                ], 403);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Detail pesanan berhasil diambil',
                'data' => $pesanan
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil detail pesanan',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * =====================================================
     * MENGUBAH STATUS PESANAN
     *
     * PUT /api/pesanan/{id}/status
     * =====================================================
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {

            // =============================================
            // CARI PESANAN
            // =============================================

            $pesanan = Pesanan::find($id);

            if (!$pesanan) {

                return response()->json([
                    'status' => 'error',
                    'message' => 'Pesanan tidak ditemukan'
                ], 404);
            }


            // =============================================
            // VALIDASI STATUS
            // =============================================

            $validated = $request->validate([

                'status_pembayaran' => [
                    'sometimes',
                    Rule::in([
                        'pending',
                        'menunggu_verifikasi',
                        'lunas',
                        'gagal'
                    ])
                ],

                // Alasan penolakan ditulis admin, dibaca customer.
                'alasan_penolakan' => [
                    'nullable',
                    'string',
                    'max:500'
                ],

                'status_pengiriman' => [
                    'sometimes',
                    Rule::in([
                        'dikemas',
                        'dikirim',
                        'selesai',
                        'dibatalkan'
                    ])
                ],

            ]);


            // =============================================
            // CEK STATUS SEBELUMNYA UNTUK STOK
            // =============================================
            
            $oldStatusPengiriman = $pesanan->status_pengiriman;
            $oldStatusPembayaran = $pesanan->status_pembayaran;

            // =============================================
            // UPDATE STATUS PEMBAYARAN
            // =============================================

            if (isset($validated['status_pembayaran'])) {

                $pesanan->status_pembayaran = $validated['status_pembayaran'];

                // Catat kapan pembayaran dinyatakan lunas.
                if ($validated['status_pembayaran'] === 'lunas'
                    && !$pesanan->tanggal_pembayaran) {
                    $pesanan->tanggal_pembayaran = now();
                }

                // Alasan hanya relevan saat menolak. Saat status
                // berubah ke selain 'gagal', alasan lama dibersihkan.
                if ($validated['status_pembayaran'] === 'gagal') {

                    // Menolak pembayaran WAJIB disertai alasan,
                    // karena customer perlu tahu apa yang harus diperbaiki.
                    $alasan = $validated['alasan_penolakan']
                        ?? $pesanan->alasan_penolakan;

                    if (!$alasan || trim($alasan) === '') {
                        return response()->json([
                            'status' => 'error',
                            'message' => 'Alasan penolakan wajib diisi.',
                            'errors' => [
                                'alasan_penolakan' => ['Alasan penolakan wajib diisi.']
                            ]
                        ], 422);
                    }

                    $pesanan->alasan_penolakan = $alasan;

                } else {
                    $pesanan->alasan_penolakan = null;
                }
            }

            // =============================================
            // UPDATE STATUS PENGIRIMAN
            // =============================================

            if (isset($validated['status_pengiriman'])) {
                $pesanan->status_pengiriman = $validated['status_pengiriman'];
            }

            // =============================================
            // RESTORE STOK (CEGAH DOUBLE RESTORE)
            // =============================================
            
            $isCancelled = ($pesanan->status_pengiriman === 'dibatalkan' || $pesanan->status_pembayaran === 'gagal');
            $wasCancelled = ($oldStatusPengiriman === 'dibatalkan' || $oldStatusPembayaran === 'gagal');
            
            if ($isCancelled && !$wasCancelled) {
                // Restore stok
                foreach ($pesanan->detail as $detail) {
                    $produk = $detail->produk;
                    if ($produk) {
                        $produk->stok += $detail->jumlah;
                        $produk->save();
                    }
                }
            }

            // =============================================
            // SIMPAN PERUBAHAN
            // =============================================

            $pesanan->save();


            // =============================================
            // LOAD RELASI
            // =============================================

            $pesanan->load([
                'user',
                'detail.produk'
            ]);


            // =============================================
            // RESPONSE
            // =============================================

            return response()->json([
                'status' => 'success',
                'message' => 'Status pesanan berhasil diperbarui',
                'data' => $pesanan
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {

            return response()->json([
                'status' => 'error',
                'message' => 'Data status tidak valid',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memperbarui status pesanan',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * =====================================================
     * UPLOAD BUKTI PEMBAYARAN (CUSTOMER)
     *
     * POST /api/pesanan/{id}/bukti-pembayaran
     * multipart/form-data, field: bukti_pembayaran
     *
     * Kolom `bukti_pembayaran` sudah ada sejak migration
     * 2026_09_04_000001 — di sini hanya ditambahkan jalurnya.
     * =====================================================
     */
    public function uploadBukti(Request $request, $id): JsonResponse
    {
        try {

            $pesanan = Pesanan::find($id);

            if (!$pesanan) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Pesanan tidak ditemukan'
                ], 404);
            }

            // =============================================
            // OTORISASI
            // Customer hanya boleh mengunggah bukti untuk
            // pesanannya sendiri. Admin boleh untuk semua.
            // =============================================

            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Belum terautentikasi.'
                ], 401);
            }

            if ($user->role !== 'admin'
                && (int) $pesanan->id_user !== (int) $user->id_user) {

                return response()->json([
                    'status' => 'error',
                    'message' => 'Kamu tidak berhak mengubah pesanan ini.'
                ], 403);
            }

            // =============================================
            // PESANAN YANG SUDAH LUNAS TIDAK PERLU BUKTI LAGI
            // =============================================

            if ($pesanan->status_pembayaran === 'lunas') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Pesanan ini sudah lunas.'
                ], 422);
            }

            // =============================================
            // VALIDASI FILE
            // =============================================

            $request->validate([
                'bukti_pembayaran' => [
                    'required',
                    'image',
                    'mimes:jpg,jpeg,png,webp',
                    'max:2048', // 2 MB
                ],
            ]);

            // =============================================
            // SIMPAN FILE
            // =============================================

            $path = $request->file('bukti_pembayaran')
                ->store('bukti_pembayaran', 'local');

            // Hapus bukti lama agar storage tidak menumpuk.
            if ($pesanan->bukti_pembayaran) {
                Storage::disk('local')->delete($pesanan->bukti_pembayaran);
            }

            $pesanan->bukti_pembayaran = $path;
            $pesanan->tanggal_pembayaran = now();
            $pesanan->alasan_penolakan = null;

            // Menunggu diperiksa admin.
            $pesanan->status_pembayaran = 'menunggu_verifikasi';

            $pesanan->save();

            $pesanan->load(['user', 'detail.produk']);

            return response()->json([
                'status' => 'success',
                'message' => 'Bukti pembayaran berhasil dikirim. Menunggu verifikasi admin.',
                'data' => $pesanan
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {

            return response()->json([
                'status' => 'error',
                'message' => 'File bukti pembayaran tidak valid',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengunggah bukti pembayaran',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * =====================================================
     * MENAMPILKAN FILE BUKTI PEMBAYARAN
     *
     * GET /api/pesanan/{id}/bukti-pembayaran
     *
     * File disimpan di disk PRIVAT (storage/app), bukan di
     * public/, sehingga tidak bisa diakses lewat URL langsung.
     * Satu-satunya jalan masuk adalah endpoint ini, yang
     * memeriksa otorisasi lebih dulu:
     *   - admin  : boleh semua
     *   - customer: hanya bukti pesanannya sendiri
     * =====================================================
     */
    public function lihatBukti(Request $request, $id)
    {
        $pesanan = Pesanan::find($id);

        if (!$pesanan) {
            return response()->json([
                'status' => 'error',
                'message' => 'Pesanan tidak ditemukan'
            ], 404);
        }

        $user = $request->user();

        if ($user->role !== 'admin'
            && (int) $pesanan->id_user !== (int) $user->id_user) {

            return response()->json([
                'status' => 'error',
                'message' => 'Kamu tidak berhak melihat bukti pembayaran ini.'
            ], 403);
        }

        if (!$pesanan->bukti_pembayaran
            || !Storage::disk('local')->exists($pesanan->bukti_pembayaran)) {

            return response()->json([
                'status' => 'error',
                'message' => 'Bukti pembayaran belum tersedia'
            ], 404);
        }

        // Path berasal dari database (dihasilkan Laravel saat upload),
        // tidak pernah dari input client — jadi tidak ada celah traversal.
        return response()->file(
            Storage::disk('local')->path($pesanan->bukti_pembayaran)
        );
    }


    /**
     * =====================================================
     * MENGHAPUS PESANAN
     *
     * DELETE /api/pesanan/{id}
     * =====================================================
     */
    public function destroy($id): JsonResponse
    {
        try {

            // =============================================
            // CARI PESANAN
            // =============================================

            $pesanan = Pesanan::find($id);

            if (!$pesanan) {

                return response()->json([
                    'status' => 'error',
                    'message' => 'Pesanan tidak ditemukan'
                ], 404);
            }


            // =============================================
            // HAPUS PESANAN
            // =============================================

            $pesanan->delete();


            // =============================================
            // RESPONSE
            // =============================================

            return response()->json([
                'status' => 'success',
                'message' => 'Pesanan berhasil dihapus'
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menghapus pesanan',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}