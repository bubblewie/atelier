<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * =====================================================
 * VERIFIKASI PEMBAYARAN — MIGRATION ADITIF
 * =====================================================
 * Migration ini HANYA menambah kemampuan baru. Tidak ada
 * kolom yang dihapus, tidak ada data yang diubah nilainya.
 *
 * 1. Kolom baru `tanggal_pembayaran` (nullable)
 *    Diisi saat customer mengirim konfirmasi pembayaran.
 *
 * 2. Kolom baru `alasan_penolakan` (nullable)
 *    Diisi admin saat menolak pembayaran, dibaca customer.
 *
 * 3. Melebarkan kolom `status_pembayaran` menjadi VARCHAR(30).
 *    Kolom ini kemungkinan bertipe ENUM('pending','lunas','gagal')
 *    sehingga nilai baru 'menunggu_verifikasi' akan ditolak MySQL.
 *    Mengubah ENUM -> VARCHAR bersifat MELEBARKAN: seluruh nilai
 *    lama tetap valid dan tersimpan apa adanya. Tidak ada baris
 *    yang berubah.
 *
 * Kolom `bukti_pembayaran` TIDAK dibuat di sini karena sudah ada
 * sejak migration 2026_09_04_000001.
 * =====================================================
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tbl_pesanan', function (Blueprint $table) {
            if (!Schema::hasColumn('tbl_pesanan', 'tanggal_pembayaran')) {
                $table->timestamp('tanggal_pembayaran')
                    ->nullable()
                    ->after('bukti_pembayaran');
            }

            if (!Schema::hasColumn('tbl_pesanan', 'alasan_penolakan')) {
                $table->text('alasan_penolakan')
                    ->nullable()
                    ->after('tanggal_pembayaran');
            }
        });

        // Lebarkan status_pembayaran agar menerima 'menunggu_verifikasi'.
        // Hanya untuk MySQL/MariaDB — engine lain dilewati dengan aman.
        if (DB::getDriverName() === 'mysql') {
            DB::statement(
                "ALTER TABLE tbl_pesanan
                 MODIFY status_pembayaran VARCHAR(30) NOT NULL DEFAULT 'pending'"
            );
        }
    }

    public function down(): void
    {
        Schema::table('tbl_pesanan', function (Blueprint $table) {
            foreach (['alasan_penolakan', 'tanggal_pembayaran'] as $column) {
                if (Schema::hasColumn('tbl_pesanan', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        // Catatan: kolom status_pembayaran sengaja TIDAK dikembalikan ke ENUM.
        // Menyempitkannya kembali berpotensi menghapus data pesanan yang
        // sudah terlanjur berstatus 'menunggu_verifikasi'.
    }
};
