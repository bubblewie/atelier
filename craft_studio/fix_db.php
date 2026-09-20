<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

DB::statement("ALTER TABLE tbl_pesanan MODIFY COLUMN status_pembayaran ENUM('pending', 'lunas', 'gagal', 'batal') DEFAULT 'pending'");
DB::statement("ALTER TABLE tbl_pesanan MODIFY COLUMN status_pengiriman ENUM('dikemas', 'dikirim', 'selesai', 'dibatalkan') DEFAULT 'dikemas'");

echo "DB FIXED\n";
