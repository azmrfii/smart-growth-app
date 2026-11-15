<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * [KEAMANAN] Role-Based Access Control (RBAC) — SKPL CI-01-D.
 *
 * Dipasang di routes/api.php, contoh:
 *   ->middleware('role:Super Admin')
 *   ->middleware('role:Ahli Gizi,Admin dapur MBG')
 *
 * Urutan pengecekan:
 *   1. Sudah login?            tidak -> 401
 *   2. Akun masih "Aktif"?     tidak -> 403 (token dihapus)
 *   3. Role termasuk yang diizinkan?  tidak -> 403
 */
class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak: Anda harus login terlebih dahulu.',
            ], 401);
        }

        if ($user->status !== 'Aktif') {
            $user->currentAccessToken()?->delete();

            return response()->json([
                'success' => false,
                'message' => 'Akun Anda tidak aktif. Silakan hubungi Super Admin.',
            ], 403);
        }

        if (!empty($roles) && !in_array($user->role, $roles, true)) {
            return response()->json([
                'success' => false,
                'message' => "Akses ditolak: Peran Anda ({$user->role}) tidak memiliki izin untuk tindakan ini.",
            ], 403);
        }

        return $next($request);
    }
}
