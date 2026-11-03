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
*/

// Health check
Route::get('/ping', function () {
    return response()->json([
        'status' => 'ok',
        'app' => 'Smart Growth API',
        'timestamp' => now()->toIso8601String(),
    ]);
});

// Authentication (FR-01, FR-11)
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout']);
Route::get('/me', [AuthController::class, 'me']);
Route::get('/sidebar', [AuthController::class, 'sidebar']);

// Dashboard Overview by Role
Route::get('/dashboard', [DashboardController::class, 'index']);

// Kelola Pengguna (FR-10, Super Admin)
Route::apiResource('users', UserController::class);

// Kelola Data Anak (FR-02, Tata Usaha & Admin Dapur)
Route::apiResource('anak', AnakController::class);

// Standar Gizi (FR-03, Ahli Gizi)
Route::get('/standard-gizi', [StandardGiziController::class, 'index']);
Route::put('/standard-gizi/{id}', [StandardGiziController::class, 'update']);

// Status Gizi & Z-Score Analysis (FR-04, Ahli Gizi & Admin Dapur)
Route::get('/status-gizi', [StatusGiziController::class, 'index']);
Route::get('/status-gizi/anak/{id}', [StatusGiziController::class, 'checkAnak']);

// Rekomendasi Menu & Builder (FR-05, FR-06, Ahli Gizi)
Route::get('/foods', [RekomendasiMenuController::class, 'getFoods']);
Route::post('/foods', [RekomendasiMenuController::class, 'storeFood']);
Route::get('/rekomendasi-menu', [RekomendasiMenuController::class, 'index']);
Route::post('/rekomendasi-menu/generate', [RekomendasiMenuController::class, 'generate']);
Route::post('/rekomendasi-menu/draft', [RekomendasiMenuController::class, 'saveDraft']);
Route::post('/rekomendasi-menu/{id}/approve', [RekomendasiMenuController::class, 'approve']);
Route::delete('/rekomendasi-menu/{id}', [RekomendasiMenuController::class, 'destroy']);

// Laporan Final Menu (FR-07, FR-08, FR-09, Admin Dapur MBG)
Route::get('/laporan-menu', [LaporanMenuController::class, 'index']);
Route::get('/laporan-menu/{id}/pdf', [LaporanMenuController::class, 'downloadPdf']);

