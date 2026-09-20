<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kategori extends Model
{
    protected $table = 'tbl_kategori';

    protected $primaryKey = 'id_kategori';

    protected $fillable = [
        'nama_kategori',
        'slug'
    ];

    /**
     * Relasi kategori ke produk
     */
    public function produk()
    {
        return $this->hasMany(
            Produk::class,
            'id_kategori',
            'id_kategori'
        );
    }
}