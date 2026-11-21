<?php

use App\Http\Controllers\Api\AnakController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\LaporanMenuController;
use App\Http\Controllers\Api\RekomendasiMenuController;
use App\Http\Controllers\Api\StandardGiziController;
use App\Http\Controllers\Api\StatusGiziController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes for Smart Growth
|--------------------------------------------------------------------------
| [KEAMANAN] Setiap route dilindungi 2 lapis:
|   1. auth:sanctum -> wajib mengirim token login (header Authorization: Bearer ...)
|   2. role:...     -> role pengguna harus termasuk yang diizinkan
|
| Ringkasan hak akses (sesuai SKPL & sidebar frontend):
|   Super Admin      : Kelola Pengguna
|   Tata Usaha       : Data Anak (tambah/edit/hapus)
|   Ahli Gizi        : Standar Gizi, Status Gizi, Rekomendasi Menu
|   Admin dapur MBG  : Laporan Menu, Status Gizi
|   Semua role       : melihat daftar anak, profil sendiri, sidebar, logout
*/

// ---------- Publik (tanpa login) ----------
Route::get('/ping', function () {
    return response()->json([
        'status' => 'ok',
        'app' => 'Smart Growth API',
        'timestamp' => now()->toIso8601String(),
    ]);
});

// FR-01 Login. Dibatasi 10 percobaan per menit per IP (mencegah tebak password).
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

// Aktivasi akun via OTP email (publik; dibatasi agar OTP tidak bisa ditebak).
Route::post('/activate', [AuthController::class, 'activate'])->middleware('throttle:10,1');
Route::post('/activate/resend', [AuthController::class, 'resendOtp'])->middleware('throttle:3,1');

// Unduh laporan (HTML siap cetak). Masih publik karena frontend membukanya
// lewat window.open() yang tidak bisa mengirim token. Isinya hanya jadwal menu,
// tanpa data pribadi anak. (Lihat catatan di README untuk pengembangan berikutnya.)
Route::get('/laporan-menu/{id}/pdf', [LaporanMenuController::class, 'downloadPdf']);

// ---------- Wajib login ----------
Route::middleware(['auth:sanctum', 'role'])->group(function () {

    // FR-11 Logout & profil (semua role)
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/sidebar', [AuthController::class, 'sidebar']);
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // FR-02 Data Anak: semua role boleh MELIHAT (dipakai halaman Status Gizi & Rekomendasi Menu)
    Route::get('/anak', [AnakController::class, 'index']);
    Route::get('/anak/{anak}', [AnakController::class, 'show']);

    // FR-02 Data Anak: hanya Tata Usaha yang boleh MENGUBAH
    Route::middleware('role:Tata Usaha')->group(function () {
        Route::post('/anak', [AnakController::class, 'store']);
        Route::put('/anak/{anak}', [AnakController::class, 'update']);
        Route::delete('/anak/{anak}', [AnakController::class, 'destroy']);
    });

    // FR-10 Kelola Pengguna: hanya Super Admin
    Route::middleware('role:Super Admin')->group(function () {
        Route::apiResource('users', UserController::class);
    });

    // FR-04 Ringkasan Status Gizi: Ahli Gizi & Admin Dapur
    Route::middleware('role:Ahli Gizi,Admin dapur MBG')->group(function () {
        Route::get('/status-gizi', [StatusGiziController::class, 'index']);
    });

    // FR-03, FR-04, FR-05, FR-06: Ahli Gizi
    Route::middleware('role:Ahli Gizi')->group(function () {
        Route::get('/standard-gizi', [StandardGiziController::class, 'index']);
        Route::put('/standard-gizi/{id}', [StandardGiziController::class, 'update']);

        Route::get('/status-gizi/anak/{id}', [StatusGiziController::class, 'checkAnak']);

        Route::get('/foods', [RekomendasiMenuController::class, 'getFoods']);
        Route::post('/foods', [RekomendasiMenuController::class, 'storeFood']);
        Route::get('/rekomendasi-menu', [RekomendasiMenuController::class, 'index']);
        Route::post('/rekomendasi-menu/generate', [RekomendasiMenuController::class, 'generate']);
        Route::post('/rekomendasi-menu/draft', [RekomendasiMenuController::class, 'saveDraft']);
        Route::post('/rekomendasi-menu/{id}/approve', [RekomendasiMenuController::class, 'approve']);
        Route::delete('/rekomendasi-menu/{id}', [RekomendasiMenuController::class, 'destroy']);
    });

    // FR-07, FR-08: Laporan Final Menu — Admin Dapur (Ahli Gizi boleh melihat)
    Route::middleware('role:Admin dapur MBG,Ahli Gizi')->group(function () {
        Route::get('/laporan-menu', [LaporanMenuController::class, 'index']);
    });
});
