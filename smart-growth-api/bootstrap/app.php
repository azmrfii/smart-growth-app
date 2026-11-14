<?php

use App\Http\Middleware\CorsMiddleware;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->append(CorsMiddleware::class);
        $middleware->alias([
            'role' => RoleMiddleware::class,
        ]);

        // API tidak punya halaman login, jadi tamu tidak di-redirect.
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Semua error di /api/* dikirim sebagai JSON (bukan halaman HTML).
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api/*') || $request->expectsJson());

        // [KEAMANAN] Request tanpa token / token tidak valid -> 401 dengan pesan Bahasa Indonesia.
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sesi berakhir atau Anda belum login. Silakan login kembali.',
                ], 401);
            }
        });
    })->create();
