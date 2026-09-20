<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

/**
 * =====================================================
 * PROFIL & KATA SANDI
 * =====================================================
 * Memenuhi Bab 4.1 buku panduan. Semua endpoint di sini
 * berada di grup auth:sanctum dan hanya menyentuh akun
 * milik user yang sedang login — tidak ada cara mengubah
 * akun orang lain lewat controller ini.
 * =====================================================
 */
class ProfileController extends Controller
{
    /* ============================================================
       GET /api/profile
       ============================================================ */
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'status'  => 'success',
            'message' => 'Profil berhasil diambil',
            'data'    => $request->user(),
        ], 200);
    }

    /* ============================================================
       PUT /api/profile
       ============================================================ */
    public function update(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            $validated = $request->validate([
                'nama' => ['sometimes', 'required', 'string', 'max:255'],

                'email' => [
                    'sometimes',
                    'required',
                    'email',
                    'max:255',
                    Rule::unique('users', 'email')->ignore($user->id_user, 'id_user'),
                ],

                'no_telepon' => ['nullable', 'string', 'max:20'],
                'alamat'     => ['nullable', 'string'],
            ]);

            // `role` sengaja tidak ikut divalidasi maupun disimpan.
            // Tanpa ini, customer bisa menaikkan dirinya jadi admin.
            $user->fill($validated);
            $user->save();

            return response()->json([
                'status'  => 'success',
                'message' => 'Profil berhasil diperbarui',
                'data'    => $user->fresh(),
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Data profil tidak valid',
                'errors'  => $e->errors(),
            ], 422);
        }
    }

    /* ============================================================
       PUT /api/profile/password
       ============================================================ */
    public function updatePassword(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            $validated = $request->validate([
                'password_lama' => ['required', 'string'],
                'password'      => ['required', 'string', 'min:6', 'confirmed'],
            ]);

            if (!Hash::check($validated['password_lama'], $user->password)) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Kata sandi lama tidak cocok',
                    'errors'  => ['password_lama' => ['Kata sandi lama tidak cocok.']],
                ], 422);
            }

            // Model User memakai cast 'hashed', jadi tidak perlu Hash::make.
            $user->password = $validated['password'];
            $user->save();

            // Cabut seluruh token lain agar sesi lama tidak bisa dipakai
            // setelah kata sandi berganti.
            $current = $request->user()->currentAccessToken();
            $user->tokens()->where('id', '!=', $current?->id)->delete();

            return response()->json([
                'status'  => 'success',
                'message' => 'Kata sandi berhasil diperbarui',
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Data kata sandi tidak valid',
                'errors'  => $e->errors(),
            ], 422);
        }
    }
}
