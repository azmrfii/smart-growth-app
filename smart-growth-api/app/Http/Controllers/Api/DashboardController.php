<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Anak;
use App\Models\AuditLog;
use App\Models\LaporanMenu;
use App\Models\RekomendasiMenu;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Get dashboard metrics tailored for the user's role.
     */
    public function index(Request $request): JsonResponse
    {
        $role = $request->query('role') ?? $request->user()?->role ?? 'Super Admin';

        $totalKids = Anak::count();
        $giziBaik = Anak::where('status_gizi', 'Gizi Baik')->count();
        $giziKurang = Anak::where('status_gizi', 'Gizi Kurang')->count();
        $giziBuruk = Anak::where('status_gizi', 'Gizi Buruk')->count();
        $giziLebih = Anak::where('status_gizi', 'Gizi Lebih')->count();
        $obesitas = Anak::where('status_gizi', 'Obesitas')->count();

        $data = [
            'role' => $role,
            'summary' => [
                'totalKids' => $totalKids,
                'totalUsers' => User::where('status', '!=', 'Deleted')->count(),
                'activeUsers' => User::where('status', 'Aktif')->count(),
                'draftMenus' => RekomendasiMenu::where('status', 'draft')->count(),
                'approvedMenus' => RekomendasiMenu::where('status', 'submitted')->count(),
                'reportsCount' => LaporanMenu::count(),
            ],
            'nutritionDistribution' => [
                ['status' => 'Gizi Buruk', 'count' => $giziBuruk, 'percent' => $totalKids ? round(($giziBuruk / $totalKids) * 100) : 0],
                ['status' => 'Gizi Kurang', 'count' => $giziKurang, 'percent' => $totalKids ? round(($giziKurang / $totalKids) * 100) : 0],
                ['status' => 'Gizi Baik', 'count' => $giziBaik, 'percent' => $totalKids ? round(($giziBaik / $totalKids) * 100) : 0],
                ['status' => 'Gizi Lebih', 'count' => $giziLebih, 'percent' => $totalKids ? round(($giziLebih / $totalKids) * 100) : 0],
                ['status' => 'Obesitas', 'count' => $obesitas, 'percent' => $totalKids ? round(($obesitas / $totalKids) * 100) : 0],
            ],
            'recentLogs' => AuditLog::orderByDesc('created_at')->limit(5)->get(),
        ];

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}

