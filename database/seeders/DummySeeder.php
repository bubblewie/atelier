<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Kategori;
use App\Models\Produk;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DummySeeder extends Seeder
{
    public function run(): void
    {
        // 1. Akun Admin & Customer
        User::create([
            'nama' => 'Admin Studio',
            'email' => 'admin@craft.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'no_telepon' => '081234567890',
            'alamat' => 'Jl. Aesthetic No. 1'
        ]);

        User::create([
            'nama' => 'Customer Cantik',
            'email' => 'customer@craft.com',
            'password' => Hash::make('password123'),
            'role' => 'customer',
            'no_telepon' => '089876543210',
            'alamat' => 'Jl. Mawar Pastel No. 12'
        ]);

        // 2. Kategori Contoh
        $kategori1 = Kategori::create([
            'nama_kategori' => 'Stationery Pastel',
            'slug' => Str::slug('Stationery Pastel')
        ]);

        $kategori2 = Kategori::create([
            'nama_kategori' => 'Cute Toys & Craft',
            'slug' => Str::slug('Cute Toys & Craft')
        ]);

        // 3. Produk Contoh
        Produk::create([
            'id_kategori' => $kategori1->id_kategori,
            'nama_produk' => 'Pulpen Aesthetic Soft Pastel (Set 5 Pcs)',
            'slug' => Str::slug('Pulpen Aesthetic Soft Pastel (Set 5 Pcs)'),
            'harga' => 25000,
            'stok' => 50,
            'deskripsi' => 'Set pulpen gel hitam 0.5mm dengan warna bodi pastel yang elegan dan nyaman digenggam.'
        ]);

        Produk::create([
            'id_kategori' => $kategori2->id_kategori,
            'nama_produk' => 'Mini Blindbox Cute Animal Plush',
            'slug' => Str::slug('Mini Blindbox Cute Animal Plush'),
            'harga' => 45000,
            'stok' => 20,
            'deskripsi' => 'Gantungan kunci boneka hewan lucu edisi terbatas.'
        ]);
    }
}