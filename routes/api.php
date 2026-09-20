<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BackupController;
use App\Http\Controllers\Api\KategoriController;
use App\Http\Controllers\Api\LaporanController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\UserController;

use App\Http\Controllers\ProdukController;
use App\Http\Controllers\PesananController;
use App\Http\Controllers\CheckoutController;

/*
|--------------------------------------------------------------------------
| API ATELIER / CRAFT STUDIO
|--------------------------------------------------------------------------
| Route dikelompokkan menjadi tiga lapis:
|
|   PUBLIC   — bisa diakses tanpa login (katalog, auth)
|   AUTH     — butuh token Sanctum (customer maupun admin)
|   ADMIN    — butuh token Sanctum DAN role admin
|
| Seluruh path, HTTP method, dan bentuk request/response yang
| sudah ada DIPERTAHANKAN. Yang berubah hanyalah siapa yang
| boleh memanggilnya.
|--------------------------------------------------------------------------
*/

/* ---------------------------- PUBLIC ---------------------------- */

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// CATATAN KEAMANAN
// `/register-admin` DIPINDAHKAN ke grup admin di bawah. Endpoint ini
// membuat akun dengan role 'admin' secara hardcoded, jadi selama ia
// publik siapa pun bisa mengangkat dirinya sendiri jadi admin hanya
// dengan satu request. Sekarang hanya admin yang sudah login yang
// boleh membuat admin baru.
//
// Admin pertama dibuat lewat seeder (DummySeeder) atau `php artisan tinker`,
// bukan lewat HTTP.

// Katalog memang harus publik — homepage dan halaman produk
// mengandalkannya sebelum user login.
Route::get('/kategori', [KategoriController::class, 'index']);
Route::get('/kategori/{id}', [KategoriController::class, 'show']);
Route::get('/produk', [ProdukController::class, 'index']);
Route::get('/produk/{id}', [ProdukController::class, 'show']);

/* ------------------ AUTHENTICATED (customer & admin) ------------------ */

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);

    // Profil & kata sandi milik sendiri
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);

    // Checkout
    Route::post('/checkout', [CheckoutController::class, 'checkout']);

    // Riwayat & detail pesanan
    Route::get('/pesanan/user/{id_user}', [PesananController::class, 'riwayatUser']);
    Route::get('/pesanan/{id}', [PesananController::class, 'show']);

    // Upload bukti pembayaran. Otorisasi per-pesanan diperiksa di
    // controller: customer hanya boleh untuk pesanannya sendiri.
    Route::post(
        '/pesanan/{id}/bukti-pembayaran',
        [PesananController::class, 'uploadBukti']
    );

    // Menampilkan file bukti. File ada di disk privat, jadi endpoint
    // inilah satu-satunya jalan masuk — dan ia memeriksa otorisasi.
    Route::get(
        '/pesanan/{id}/bukti-pembayaran',
        [PesananController::class, 'lihatBukti']
    );
});

/* ---------------------------- ADMIN ONLY ---------------------------- */

Route::middleware(['auth:sanctum', 'admin'])->group(function () {

    // Pembuatan admin baru — hanya oleh admin yang sudah login.
    Route::post('/register-admin', [AuthController::class, 'registerAdmin']);

    // Kategori (tulis)
    Route::post('/kategori', [KategoriController::class, 'store']);
    Route::put('/kategori/{id}', [KategoriController::class, 'update']);
    Route::delete('/kategori/{id}', [KategoriController::class, 'destroy']);

    // Produk (tulis)
    Route::post('/produk', [ProdukController::class, 'store']);
    Route::put('/produk/{id}', [ProdukController::class, 'update']);
    Route::delete('/produk/{id}', [ProdukController::class, 'destroy']);

    // Pesanan & verifikasi pembayaran
    Route::get('/pesanan', [PesananController::class, 'index']);
    Route::put('/pesanan/{id}/status', [PesananController::class, 'update']);
    Route::delete('/pesanan/{id}', [PesananController::class, 'destroy']);

    // Laporan penjualan — agregasi dilakukan di database
    Route::get('/laporan', [LaporanController::class, 'index']);
    Route::get('/laporan/export', [LaporanController::class, 'export']);

    // User management — hanya admin
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::put('/users/{id}/role', [UserController::class, 'updateRole']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    // Backup & restore database
    Route::get('/backup', [BackupController::class, 'index']);
    Route::post('/backup', [BackupController::class, 'store']);
    Route::get('/backup/{filename}/download', [BackupController::class, 'download']);
    Route::post('/backup/{filename}/restore', [BackupController::class, 'restore']);
    Route::delete('/backup/{filename}', [BackupController::class, 'destroy']);
});

/*
|--------------------------------------------------------------------------
| CATATAN
|--------------------------------------------------------------------------
| Route lama `Route::post('/pesanan', ...)` DIHAPUS karena menunjuk method
| PesananController@store yang tidak pernah ada — memanggilnya selalu
| menghasilkan error. Tidak ada functionality yang hilang; pembuatan
| pesanan tetap lewat POST /checkout seperti semula.
|--------------------------------------------------------------------------
*/
