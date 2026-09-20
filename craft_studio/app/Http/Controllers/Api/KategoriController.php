<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kategori;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class KategoriController extends Controller
{
    // Menampilkan semua data
    public function index()
    {
        $kategori = Kategori::all();

        return response()->json([
            'status' => 'success',
            'data' => $kategori
        ]);
    }

    // Menyimpan data baru
    public function store(Request $request)
    {
        $request->validate([
            'nama_kategori' => 'required|max:100'
        ]);

        $kategori = Kategori::create([
            'nama_kategori' => $request->nama_kategori,
            'slug' => Str::slug($request->nama_kategori)
        ]);

        return response()->json([
            'status' => 'success',
            'data' => $kategori
        ], 201);
    }

    // Menampilkan satu data
    public function show($id)
    {
        $kategori = Kategori::findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $kategori
        ]);
    }

    // Mengubah data
    public function update(Request $request, $id)
    {
        $request->validate([
            'nama_kategori' => 'required|max:100'
        ]);

        $kategori = Kategori::findOrFail($id);

        $kategori->update([
            'nama_kategori' => $request->nama_kategori,
            'slug' => Str::slug($request->nama_kategori)
        ]);

        return response()->json([
            'status' => 'success',
            'data' => $kategori
        ]);
    }

    // Menghapus data
    public function destroy($id)
    {
        $kategori = Kategori::findOrFail($id);
        $kategori->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Data berhasil dihapus'
        ]);
    }
}