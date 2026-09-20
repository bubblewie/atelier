<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pesanan extends Model
{
    protected $table = 'tbl_pesanan';

    protected $primaryKey = 'id_pesanan';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'kode_transaksi',
        'id_user',
        'tanggal_transaksi',
        'total_harga',
        'status_pembayaran',
        'metode_pembayaran',
        'bukti_pembayaran',
        'status_pengiriman',
        'catatan',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'id_user',
            'id_user'
        );
    }

    public function detail(): HasMany
    {
        return $this->hasMany(
            PesananDetail::class,
            'id_pesanan',
            'id_pesanan'
        );
    }
}