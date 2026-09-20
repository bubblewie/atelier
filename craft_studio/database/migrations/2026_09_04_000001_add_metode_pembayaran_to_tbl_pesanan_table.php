<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * =====================================================
 * TAMBAH KOLOM METODE PEMBAYARAN
 * =====================================================
 * Migration ini HANYA menambahkan 2 kolom baru ke
 * tabel tbl_pesanan yang sudah ada:
 *
 *  - metode_pembayaran  (transfer_bank | cod | ewallet)
 *  - bukti_pembayaran   (nama file bukti transfer, nullable)
 *
 * Tidak ada kolom yang dihapus/diubah, dan tidak
 * menyentuh data pesanan yang sudah ada.
 * Kolom lama tetap sama persis.
 * =====================================================
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tbl_pesanan', function (Blueprint $table) {
            $table->string('metode_pembayaran', 30)
                ->nullable()
                ->after('status_pembayaran');

            $table->string('bukti_pembayaran')
                ->nullable()
                ->after('metode_pembayaran');
        });
    }

    public function down(): void
    {
        Schema::table('tbl_pesanan', function (Blueprint $table) {
            $table->dropColumn(['metode_pembayaran', 'bukti_pembayaran']);
        });
    }
};
