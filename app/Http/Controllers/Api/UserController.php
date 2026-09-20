<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * =====================================================
 * USER MANAGEMENT — ADMIN ONLY
 * =====================================================
 * Seluruh route controller ini berada di grup
 * auth:sanctum + admin (lihat routes/api.php), jadi
 * customer yang memanggilnya langsung mendapat 403.
 *
 * Password tidak pernah ikut terkirim: model User sudah
 * mencantumkan 'password' di $hidden, dan controller ini
 * memilih kolom secara eksplisit.
 *
 * CATATAN ROLE
 * Struktur role saat ini hanya 'admin' dan 'customer'.
 * Tidak ada role baru yang ditambahkan. Satu-satunya akun
 * admin diperlakukan sebagai admin utama lewat authorization
 * backend — bukan lewat email yang di-hardcode di frontend.
 * =====================================================
 */
class UserController extends Controller
{
    /** Kolom aman untuk dikirim ke klien. */
    private const SAFE_COLUMNS = [
        'id_user',
        'nama',
        'email',
        'role',
        'no_telepon',
        'alamat',
        'created_at',
    ];

    /* ============================================================
       GET /api/users
       ============================================================ */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = User::query()->select(self::SAFE_COLUMNS);

            if ($role = $request->query('role')) {
                $query->where('role', $role);
            }

            if ($cari = $request->query('search')) {
                $query->where(function ($q) use ($cari) {
                    $q->where('nama', 'like', "%{$cari}%")
                      ->orWhere('email', 'like', "%{$cari}%");
                });
            }

            $users = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'status'  => 'success',
                'message' => 'Daftar pengguna berhasil diambil',
                'data'    => $users,
                'meta'    => [
                    'total'    => $users->count(),
                    'admin'    => $users->where('role', 'admin')->count(),
                    'customer' => $users->where('role', 'customer')->count(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal mengambil daftar pengguna',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /* ============================================================
       GET /api/users/{id}
       ============================================================ */
    public function show($id): JsonResponse
    {
        $user = User::select(self::SAFE_COLUMNS)->find($id);

        if (!$user) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Pengguna tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Detail pengguna berhasil diambil',
            'data'    => $user,
        ], 200);
    }

    /* ============================================================
       PUT /api/users/{id}/role
       ============================================================
       Mengubah role pengguna lain. Hanya admin yang bisa sampai
       ke sini, tapi masih ada dua penjagaan tambahan di bawah.
       ============================================================ */
    public function updateRole(Request $request, $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'role' => ['required', Rule::in(['admin', 'customer'])],
            ]);

            $target = User::find($id);

            if (!$target) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Pengguna tidak ditemukan',
                ], 404);
            }

            $aktor = $request->user();

            // 1. Admin tidak boleh menurunkan role dirinya sendiri.
            //    Tanpa ini, satu-satunya admin bisa mengunci dirinya keluar
            //    dari seluruh panel admin dan tidak ada cara kembali lewat UI.
            if ((int) $target->id_user === (int) $aktor->id_user
                && $validated['role'] !== 'admin') {

                return response()->json([
                    'status'  => 'error',
                    'message' => 'Kamu tidak bisa menurunkan role akunmu sendiri.',
                ], 422);
            }

            // 2. Jangan sampai sistem kehabisan admin.
            if ($target->role === 'admin' && $validated['role'] !== 'admin') {

                $jumlahAdmin = User::where('role', 'admin')->count();

                if ($jumlahAdmin <= 1) {
                    return response()->json([
                        'status'  => 'error',
                        'message' => 'Ini satu-satunya akun admin. '
                            . 'Angkat admin lain terlebih dahulu sebelum menurunkannya.',
                    ], 422);
                }
            }

            $target->role = $validated['role'];
            $target->save();

            return response()->json([
                'status'  => 'success',
                'message' => 'Role pengguna berhasil diperbarui',
                'data'    => User::select(self::SAFE_COLUMNS)->find($id),
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Role tidak valid',
                'errors'  => $e->errors(),
            ], 422);
        }
    }

    /* ============================================================
       DELETE /api/users/{id}
       ============================================================ */
    public function destroy(Request $request, $id): JsonResponse
    {
        $target = User::find($id);

        if (!$target) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Pengguna tidak ditemukan',
            ], 404);
        }

        $aktor = $request->user();

        if ((int) $target->id_user === (int) $aktor->id_user) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Kamu tidak bisa menghapus akunmu sendiri.',
            ], 422);
        }

        if ($target->role === 'admin' && User::where('role', 'admin')->count() <= 1) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Ini satu-satunya akun admin dan tidak bisa dihapus.',
            ], 422);
        }

        // Pengguna yang punya riwayat pesanan tidak dihapus, supaya
        // data transaksi tidak kehilangan pemiliknya.
        if ($target->pesanan()->exists()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Pengguna ini memiliki riwayat pesanan, '
                    . 'sehingga tidak bisa dihapus.',
            ], 422);
        }

        $target->tokens()->delete();
        $target->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Pengguna berhasil dihapus',
        ], 200);
    }
}
