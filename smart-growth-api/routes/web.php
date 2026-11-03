<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'message' => 'Smart Growth Backend API Service is running.',
        'version' => '1.0.0',
        'endpoints' => [
            'login' => '/api/login',
            'sidebar' => '/api/sidebar',
            'users' => '/api/users',
            'anak' => '/api/anak',
            'status_gizi' => '/api/status-gizi',
            'rekomendasi_menu' => '/api/rekomendasi-menu',
            'laporan_menu' => '/api/laporan-menu',
        ],
    ]);
});

