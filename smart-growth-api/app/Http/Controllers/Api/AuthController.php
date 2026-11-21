<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Use Case #1: Authentication Login (FR-01)
     * Validates credentials against MySQL and returns user profile, role, and role-based sidebar menus.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'username' => 'required|string|max:100',
            'password' => 'required|string|max:72',
        ], [
            'username.required' => 'Username wajib diisi.',
            'username.max' => 'Username terlalu panjang.',
            'password.required' => 'Password wajib diisi.',
            'password.max' => 'Password terlalu panjang.',
        ]);

        $username = trim($request->input('username'));
        $password = $request->input('password');

        $user = User::where('username', $username)->first();

        // [KEAMANAN] Password hanya dicocokkan dengan hash bcrypt.
        // Sebelumnya ada "fallback" yang menerima password teks biasa, sudah dihapus.
        if (!$user || !Hash::check($password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Username atau password tidak valid. Silakan coba lagi.',
            ], 401);
        }

        // Akun baru wajib diaktifkan dulu lewat OTP yang dikirim ke email.
        if ($user->status === 'Menunggu Aktivasi') {
            return response()->json([
                'success' => false,
                'code' => 'ACCOUNT_NOT_ACTIVATED',
                'message' => 'Akun Anda belum diaktifkan. Masukkan kode OTP yang dikirim ke email Anda.',
                'email' => $user->email,
            ], 403);
        }

        // Check user active status
        if ($user->status === 'Nonaktif' || $user->status === 'Deleted') {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda telah dinonaktifkan. Silakan hubungi Super Admin.',
            ], 403);
        }

        // [KEAMANAN] Buat token login dengan Laravel Sanctum.
        // Token disimpan (dalam bentuk hash) di tabel personal_access_tokens,
        // lalu frontend mengirimnya di header "Authorization: Bearer <token>"
        // pada setiap request berikutnya.
        $token = $user->createToken('smart-growth-frontend')->plainTextToken;

        // Audit Trail
        AuditLog::record(
            'LOGIN',
            "Pengguna {$user->name} ({$user->username}) berhasil login sebagai {$user->role}",
            $user,
            $request->ip()
        );

        // Sidebar navigation permitted specifically for this user's role
        $sidebarMenus = $user->getPermittedNavItems();

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil!',
            'data' => [
                'token' => $token,
                'user' => [
                    'id' => "usr-{$user->id_user}",
                    'id_user' => $user->id_user,
                    'username' => $user->username,
                    'email' => $user->email,
                    'name' => $user->name,
                    'role' => $user->role,
                    'status' => $user->status,
                    'avatarInitials' => $user->avatar_initials ?: strtoupper(substr($user->name, 0, 2)),
                    'defaultPage' => $user->default_page ?: User::getDefaultPageForRole($user->role),
                ],
                'sidebarMenus' => $sidebarMenus,
            ],
        ]);
    }

    /**
     * Use Case #2: Logout (FR-11)
     * Terminates active session/token.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user) {
            // [KEAMANAN] Hapus token yang sedang dipakai, sehingga token itu
            // tidak bisa dipakai lagi walaupun dicuri/disalin.
            $user->currentAccessToken()?->delete();

            AuditLog::record(
                'LOGOUT',
                "Pengguna {$user->name} ({$user->username}) logout dari sistem",
                $user,
                $request->ip()
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Sesi berhasil diakhiri. Anda telah keluar dari sistem.',
        ]);
    }

    /**
     * Get authenticated user profile and allowed sidebar menus.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => "usr-{$user->id_user}",
                    'id_user' => $user->id_user,
                    'username' => $user->username,
                    'email' => $user->email,
                    'name' => $user->name,
                    'role' => $user->role,
                    'status' => $user->status,
                    'avatarInitials' => $user->avatar_initials ?: strtoupper(substr($user->name, 0, 2)),
                    'defaultPage' => $user->default_page ?: User::getDefaultPageForRole($user->role),
                ],
                'sidebarMenus' => $user->getPermittedNavItems(),
            ],
        ]);
    }

    /**
     * Get sidebar navigation menu items for a specific role or current user.
     */
    public function sidebar(Request $request): JsonResponse
    {
        $role = $request->query('role');
        $user = $request->user();

        if (!$role && $user) {
            $role = $user->role;
        }

        $dummyUser = new User(['role' => $role ?? 'Tata Usaha']);
        $menus = $dummyUser->getPermittedNavItems();

        return response()->json([
            'success' => true,
            'role' => $role,
            'data' => $menus,
        ]);
    }

    /**
     * Aktivasi akun dengan kode OTP (publik, dibatasi throttle).
     * Pesan error untuk email tak dikenal dibuat sama dengan kode salah agar
     * tidak bisa dipakai menebak email mana yang terdaftar.
     */
    public function activate(Request $request, OtpService $otp): JsonResponse
    {
        $request->merge(['email' => strtolower(trim((string) $request->input('email')))]);

        $request->validate([
            'email' => ['required', 'string', 'max:254', 'email:rfc'],
            'otp' => ['required', 'string', 'regex:/^\d{6}$/'],
        ], [
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'otp.required' => 'Kode OTP wajib diisi.',
            'otp.regex' => 'Kode OTP harus berupa 6 digit angka.',
        ]);

        $generic = response()->json([
            'success' => false,
            'message' => 'Kode OTP tidak valid atau sudah kedaluwarsa.',
        ], 422);

        $user = User::where('email', $request->input('email'))->where('status', 'Menunggu Aktivasi')->first();
        if (!$user) {
            return $generic;
        }

        $result = $otp->verify($user, $request->input('otp'));

        if ($result === OtpService::OK) {
            AuditLog::record('AKTIVASI_AKUN', "Pengguna {$user->name} ({$user->username}) mengaktifkan akun via OTP email", $user, $request->ip());

            return response()->json([
                'success' => true,
                'message' => 'Akun berhasil diaktifkan. Silakan login.',
            ]);
        }

        if ($result === OtpService::LOCKED) {
            return response()->json([
                'success' => false,
                'message' => 'Terlalu banyak percobaan salah. Minta kode OTP baru.',
            ], 429);
        }

        if ($result === OtpService::INVALID) {
            $left = OtpService::MAX_ATTEMPTS - $user->otp_attempts;

            return response()->json([
                'success' => false,
                'message' => "Kode OTP salah. Sisa percobaan: {$left}.",
            ], 422);
        }

        return $generic;
    }

    /** Kirim ulang OTP aktivasi. Respons selalu sama agar email terdaftar tidak bocor. */
    public function resendOtp(Request $request, OtpService $otp): JsonResponse
    {
        $request->merge(['email' => strtolower(trim((string) $request->input('email')))]);

        $request->validate([
            'email' => ['required', 'string', 'max:254', 'email:rfc'],
        ], [
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
        ]);

        $user = User::where('email', $request->input('email'))->where('status', 'Menunggu Aktivasi')->first();

        if ($user && $otp->resendWaitSeconds($user) === 0) {
            try {
                $otp->issue($user);
            } catch (\Throwable $e) {
                report($e);

                return response()->json([
                    'success' => false,
                    'message' => 'Email OTP gagal dikirim. Coba lagi beberapa saat.',
                ], 502);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Jika email terdaftar dan belum aktif, kode OTP baru telah dikirim. Tunggu 60 detik sebelum meminta lagi.',
        ]);
    }
}
