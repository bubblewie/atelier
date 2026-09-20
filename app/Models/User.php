<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'users';

    protected $primaryKey = 'id_user';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'nama',
        'email',
        'password',
        'role',
        'no_telepon',
        'alamat',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    /**
     * Pesanan milik user ini.
     *
     * Ditambahkan agar UserController bisa memeriksa apakah sebuah akun
     * masih punya riwayat transaksi sebelum dihapus. Relasi ini bersifat
     * aditif dan tidak mengubah perilaku apa pun yang sudah ada.
     */
    public function pesanan(): HasMany
    {
        return $this->hasMany(
            Pesanan::class,
            'id_user',
            'id_user'
        );
    }
}