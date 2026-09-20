<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // =====================================================
    // REGISTER
    // =====================================================

    public function register(Request $request)
    {
        try {

            // ===============================
            // VALIDASI
            // ===============================

            $validated = $request->validate([
                'nama' => [
                    'required',
                    'string',
                    'max:255'
                ],

                'email' => [
                    'required',
                    'email',
                    'max:255',
                    'unique:users,email'
                ],

                'password' => [
                    'required',
                    'string',
                    'min:6',
                    'confirmed'
                ],

                'no_telepon' => [
                    'nullable',
                    'string',
                    'max:20'
                ],

                'alamat' => [
                    'nullable',
                    'string'
                ],
            ]);


            // ===============================
            // BUAT USER
            // ===============================

            $user = User::create([
                'nama' => $validated['nama'],

                'email' => $validated['email'],

                /*
                |--------------------------------------------------------------------------
                | Tidak perlu Hash::make()
                |--------------------------------------------------------------------------
                | Karena User.php sudah menggunakan:
                |
                | 'password' => 'hashed'
                |
                */

                'password' => $validated['password'],

                // Register dari halaman customer
                // otomatis menjadi customer
                'role' => 'customer',

                'no_telepon' =>
                    $validated['no_telepon'] ?? null,

                'alamat' =>
                    $validated['alamat'] ?? null,
            ]);


            // ===============================
            // BUAT TOKEN
            // ===============================

            $token = $user
                ->createToken('auth_token')
                ->plainTextToken;


            // ===============================
            // RESPONSE
            // ===============================

            return response()->json([
                'success' => true,

                'message' =>
                    'Register berhasil',

                'token' => $token,

                'data' => $user,
            ], 201);


        } catch (ValidationException $e) {

            return response()->json([
                'success' => false,

                'message' =>
                    'Data registrasi tidak valid',

                'errors' => $e->errors(),

            ], 422);


        } catch (\Exception $e) {

            return response()->json([
                'success' => false,

                'message' =>
                    'Gagal melakukan registrasi',

                'error' => $e->getMessage(),

            ], 500);
        }
    }

    // =====================================================
    // REGISTER ADMIN
    // =====================================================

    public function registerAdmin(Request $request)
    {
        try {

            // ===============================
            // VALIDASI
            // ===============================

            $validated = $request->validate([
                'nama' => [
                    'required',
                    'string',
                    'max:255'
                ],

                'email' => [
                    'required',
                    'email',
                    'max:255',
                    'unique:users,email'
                ],

                'password' => [
                    'required',
                    'string',
                    'min:6',
                    'confirmed'
                ],

                'no_telepon' => [
                    'nullable',
                    'string',
                    'max:20'
                ],

                'alamat' => [
                    'nullable',
                    'string'
                ],
            ]);


            // ===============================
            // BUAT ADMIN
            // ===============================

            $user = User::create([
                'nama' => $validated['nama'],

                'email' => $validated['email'],

                // User.php kamu sudah memakai:
                // 'password' => 'hashed'
                'password' => $validated['password'],

                // KHUSUS ADMIN
                'role' => 'admin',

                'no_telepon' =>
                    $validated['no_telepon'] ?? null,

                'alamat' =>
                    $validated['alamat'] ?? null,
            ]);


            // ===============================
            // BUAT TOKEN
            // ===============================

            $token = $user
                ->createToken('auth_token')
                ->plainTextToken;


            // ===============================
            // RESPONSE
            // ===============================

            return response()->json([
                'success' => true,

                'message' =>
                    'Admin berhasil dibuat',

                'token' => $token,

                'data' => $user,

            ], 201);


        } catch (ValidationException $e) {

            return response()->json([
                'success' => false,

                'message' =>
                    'Data admin tidak valid',

                'errors' => $e->errors(),

            ], 422);


        } catch (\Exception $e) {

            return response()->json([
                'success' => false,

                'message' =>
                    'Gagal membuat admin',

                'error' => $e->getMessage(),

            ], 500);
        }
    }


    // =====================================================
    // LOGIN
    // =====================================================

    public function login(Request $request)
    {
        try {

            // ===============================
            // VALIDASI
            // ===============================

            $validated = $request->validate([
                'email' => [
                    'required',
                    'email'
                ],

                'password' => [
                    'required',
                    'string'
                ],
            ]);


            // ===============================
            // CARI USER
            // ===============================

            $user = User::where(
                'email',
                $validated['email']
            )->first();


            // ===============================
            // CEK USER
            // ===============================

            if (!$user) {

                return response()->json([
                    'success' => false,

                    'message' =>
                        'Email atau password salah',

                ], 401);
            }


            // ===============================
            // CEK PASSWORD
            // ===============================

            if (!Hash::check(
                $validated['password'],
                $user->password
            )) {

                return response()->json([
                    'success' => false,

                    'message' =>
                        'Email atau password salah',

                ], 401);
            }


            // ===============================
            // BUAT TOKEN
            // ===============================

            $token = $user
                ->createToken('auth_token')
                ->plainTextToken;


            // ===============================
            // RESPONSE
            // ===============================

            return response()->json([
                'success' => true,

                'message' =>
                    'Login berhasil',

                'token' => $token,

                'data' => $user,

            ], 200);


        } catch (ValidationException $e) {

            return response()->json([
                'success' => false,

                'message' =>
                    'Data login tidak valid',

                'errors' => $e->errors(),

            ], 422);


        } catch (\Exception $e) {

            return response()->json([
                'success' => false,

                'message' =>
                    'Gagal melakukan login',

                'error' => $e->getMessage(),

            ], 500);
        }
    }


    // =====================================================
    // LOGOUT
    // =====================================================

    public function logout(Request $request)
    {
        try {

            $user = $request->user();

            if ($user) {

                $token =
                    $user->currentAccessToken();

                if ($token) {
                    $token->delete();
                }
            }


            return response()->json([
                'success' => true,

                'message' =>
                    'Logout berhasil',

            ], 200);


        } catch (\Exception $e) {

            return response()->json([
                'success' => false,

                'message' =>
                    'Gagal melakukan logout',

                'error' => $e->getMessage(),

            ], 500);
        }
    }


    // =====================================================
    // PROFILE
    // =====================================================

    public function profile(Request $request)
    {
        return response()->json([
            'success' => true,

            'message' =>
                'Data profile berhasil diambil',

            'data' => $request->user(),

        ], 200);
    }
}