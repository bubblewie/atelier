<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * =====================================================
 * ENSURE ADMIN
 * =====================================================
 * Dipasang SETELAH auth:sanctum. Menolak siapa pun yang
 * bukan admin, termasuk customer yang sudah login.
 *
 * Frontend route guard bukan keamanan — pengecekan yang
 * sebenarnya ada di sini.
 * =====================================================
 */
class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Belum terautentikasi.',
            ], 401);
        }

        if (($user->role ?? null) !== 'admin') {
            return response()->json([
                'status'  => 'error',
                'message' => 'Akses ditolak. Hanya admin yang boleh melakukan aksi ini.',
            ], 403);
        }

        return $next($request);
    }
}
