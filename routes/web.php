<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

// Route sementara untuk Dashboard (Biar gak error pas berhasil login)
Route::get('/dashboard', function () {
    return "Selamat! Kamu berhasil login sebagai Admin 🎉";
})->middleware('auth');

/*
|--------------------------------------------------------------------------
| FALLBACK FILE STORAGE PUBLIK
|--------------------------------------------------------------------------
| Foto produk disimpan di storage/app/public dan normalnya diakses lewat
| symlink public/storage yang dibuat `php artisan storage:link`.
|
| Di Windows symlink itu sering gagal dibuat (butuh hak Administrator atau
| Developer Mode). Yang terjadi kemudian: public/storage berdiri sebagai
| FOLDER SALINAN biasa. Isinya beku di waktu penyalinan — foto lama tetap
| tampil, foto yang baru diunggah selalu 404. Itu persis gejala yang
| dialami produk "Penggaris" dan "Penggaris joyko".
|
| Route di bawah menjadi jaring pengaman: kalau file tidak ditemukan di
| public/ (sehingga request jatuh ke Laravel), file dilayani langsung dari
| disk 'public'. Jadi gambar tetap tampil baik symlink-nya sehat maupun
| tidak.
|
| KEAMANAN
| - Hanya disk 'public' yang dilayani. Bukti pembayaran ada di disk
|   'local' (privat) dan TIDAK bisa disentuh route ini.
| - Path dari URL tidak pernah dipercaya mentah: '..' ditolak dan
|   hasilnya diverifikasi masih berada di dalam root disk, jadi tidak ada
|   celah path traversal.
| - Hanya membaca. Tidak ada operasi tulis.
*/
Route::get('/storage/{path}', function (string $path) {

    // Tolak segala bentuk upaya keluar dari folder storage.
    if (str_contains($path, '..') || str_starts_with($path, '/')) {
        abort(404);
    }

    $disk = Storage::disk('public');

    if (!$disk->exists($path)) {
        abort(404);
    }

    $absolut = realpath($disk->path($path));
    $root    = realpath($disk->path(''));

    // Verifikasi ulang setelah resolusi symlink: file HARUS tetap
    // berada di dalam root disk publik.
    if (!$absolut || !$root || !str_starts_with($absolut, $root)) {
        abort(404);
    }

    return response()->file($absolut, [
        'Cache-Control' => 'public, max-age=3600',
    ]);
})->where('path', '.*')->name('storage.public');
