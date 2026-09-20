<?php

namespace App\Http\Controllers;

use App\Models\Produk;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class ProdukController extends Controller
{
    /**
     * Menampilkan semua produk
     */
    public function index()
    {
        $produk = Produk::with('kategori')->get();

        return response()->json([
            'status' => 'success',
            'data' => $produk
        ]);
    }

    /**
     * Menyimpan produk baru
     */
    public function store(Request $request)
    {
        $request->validate([
            'id_kategori' => 'required|exists:tbl_kategori,id_kategori',
            'nama_produk' => 'required|max:150',
            'harga' => 'required|numeric|min:0',
            'stok' => 'required|integer|min:0',
            'deskripsi' => 'nullable|string',
            'foto_produk' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $fotoPath = null;

        if ($request->hasFile('foto_produk')) {
            $fotoPath = $request->file('foto_produk')
                ->store('products', 'public');
        }

        $produk = Produk::create([
            'id_kategori' => $request->id_kategori,
            'nama_produk' => $request->nama_produk,
            'slug' => $this->generateUniqueSlug($request->nama_produk),
            'harga' => $request->harga,
            'stok' => $request->stok,
            'deskripsi' => $request->deskripsi,
            'foto_produk' => $fotoPath,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Produk berhasil ditambahkan',
            'data' => $produk->load('kategori')
        ], 201);
    }

    /**
     * Menampilkan satu produk
     */
    public function show($id)
    {
        $produk = Produk::with('kategori')
            ->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $produk
        ]);
    }

    /**
     * Mengubah produk
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'id_kategori' => 'required|exists:tbl_kategori,id_kategori',
            'nama_produk' => 'required|max:150',
            'harga' => 'required|numeric|min:0',
            'stok' => 'required|integer|min:0',
            'deskripsi' => 'nullable|string',
            'foto_produk' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $produk = Produk::findOrFail($id);

        $data = [
            'id_kategori' => $request->id_kategori,
            'nama_produk' => $request->nama_produk,
            'slug' => $this->generateUniqueSlug(
                $request->nama_produk,
                $produk->id_produk
            ),
            'harga' => $request->harga,
            'stok' => $request->stok,
            'deskripsi' => $request->deskripsi,
        ];

        if ($request->hasFile('foto_produk')) {

            if ($produk->foto_produk) {
                Storage::disk('public')
                    ->delete($produk->foto_produk);
            }

            $data['foto_produk'] = $request->file('foto_produk')
                ->store('products', 'public');
        }

        $produk->update($data);

        return response()->json([
            'status' => 'success',
            'message' => 'Produk berhasil diperbarui',
            'data' => $produk->fresh()->load('kategori')
        ]);
    }

    /**
     * Menghapus produk
     */
    public function destroy($id)
    {
        $produk = Produk::findOrFail($id);

        if ($produk->foto_produk) {
            Storage::disk('public')
                ->delete($produk->foto_produk);
        }

        $produk->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Produk berhasil dihapus'
        ]);
    }

    /**
     * Membuat slug unik
     */
    private function generateUniqueSlug($nama, $id = null)
    {
        $slug = Str::slug($nama);
        $originalSlug = $slug;
        $counter = 1;

        while (
            Produk::where('slug', $slug)
                ->when($id, function ($query) use ($id) {
                    $query->where('id_produk', '!=', $id);
                })
                ->exists()
        ) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }
}