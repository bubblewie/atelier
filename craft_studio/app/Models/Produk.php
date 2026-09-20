<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Produk extends Model
{
    protected $table = 'tbl_produk';

    protected $primaryKey = 'id_produk';

    protected $fillable = [
        'id_kategori',
        'nama_produk',
        'slug',
        'harga',
        'stok',
        'deskripsi',
        'foto_produk',
    ];

    protected $casts = [
        'harga' => 'integer',
        'stok' => 'integer',
    ];

    /**
     * Relasi ke kategori
     */
    public function kategori()
    {
        return $this->belongsTo(
            Kategori::class,
            'id_kategori',
            'id_kategori'
        );
    }

    /**
     * Relasi ke detail pesanan
     */
    public function pesananDetail()
    {
        return $this->hasMany(
            PesananDetail::class,
            'id_produk',
            'id_produk'
        );
    }

    
}