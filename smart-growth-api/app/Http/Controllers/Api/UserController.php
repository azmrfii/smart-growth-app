<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    private const ROLES = ['Super Admin', 'Tata Usaha', 'Admin dapur MBG', 'Ahli Gizi'];

    private const MESSAGES = [
        'name.required' => 'Nama lengkap wajib diisi.',
        'name.min' => 'Nama lengkap minimal 3 karakter.',
        'name.max' => 'Nama lengkap maksimal 100 karakter.',
        'name.regex' => 'Nama lengkap hanya boleh berisi huruf, spasi, titik, apostrof, dan tanda hubung.',
        'username.required' => 'Username wajib diisi.',
        'username.min' => 'Username minimal 5 karakter.',
        'username.max' => 'Username maksimal 30 karakter.',
        'username.regex' => 'Username hanya boleh huruf kecil, angka, titik (.), dan garis bawah (_), tanpa spasi.',
        'username.unique' => 'Username sudah digunakan oleh akun lain.',
        'email.required' => 'Email wajib diisi.',
        'email.email' => 'Format email tidak valid.',
        'email.max' => 'Email maksimal 254 karakter.',
        'email.unique' => 'Email sudah digunakan oleh akun lain.',
        'password.required' => 'Password wajib diisi.',
        'password.min' => 'Password minimal 8 karakter.',
        'password.max' => 'Password maksimal 72 karakter.',
        'password.regex' => 'Password harus mengandung huruf dan angka, tanpa spasi.',
        'role.required' => 'Peran wajib dipilih.',
        'role.in' => 'Peran tidak valid.',
        'status.in' => 'Status tidak valid.',
    ];

    /** Rapikan masukan sebelum divalidasi (trim; email -> huruf kecil). */
    private function normalize(Request $request): void
    {
        $clean = [];
        foreach (['name', 'username', 'email'] as $key) {
            if ($request->has($key) && is_string($request->input($key))) {
                $value = trim($request->input($key));
                $clean[$key] = $key === 'email' ? strtolower($value) : ($key === 'name' ? preg_replace('/\s+/', ' ', $value) : $value);
            }
        }
        $request->merge($clean);
    }

    private function userPayload(User $u): array
    {
        return [
            'id' => "usr-{$u->id_user}",
            'id_user' => $u->id_user,
            'name' => $u->name,
            'username' => $u->username,
            'email' => $u->email,
            'role' => $u->role,
            'status' => $u->status,
            'initials' => $u->avatar_initials ?: strtoupper(substr($u->name, 0, 2)),
            'createdAt' => $u->created_at ? $u->created_at->translatedFormat('d M Y') : '10 Jan 2025',
        ];
    }

    /**
     * Use Case #8: Kelola Pengguna (FR-10) - List users
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::where('status', '!=', 'Deleted');

        if ($request->has('search') && $request->search != '') {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('username', 'like', "%{$s}%");
            });
        }

        if ($request->has('role') && $request->role != 'all') {
            $query->where('role', $request->role);
        }

        $users = $query->orderBy('name')->get()->map(fn ($u) => $this->userPayload($u));

        return response()->json([
            'success' => true,
            'data' => $users,
            'summary' => [
                'total' => $users->count(),
                'active' => $users->where('status', 'Aktif')->count(),
                'roles_count' => 4,
            ],
        ]);
    }

    /**
     * Store a newly created user (FR-10 Tambah Pengguna)
     */
    public function store(Request $request): JsonResponse
    {
        $this->normalize($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'min:3', 'max:100', "regex:/^[\\pL][\\pL .'-]*$/u"],
            'username' => ['required', 'string', 'min:5', 'max:30', 'regex:/^[a-z0-9._]+$/', 'unique:users,username'],
            'email' => ['required', 'string', 'max:254', 'email:rfc', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'max:72', 'regex:/^(?=.*[A-Za-z])(?=.*\\d)\\S+$/'],
            'role' => ['required', Rule::in(self::ROLES)],
        ], self::MESSAGES);

        $initials = strtoupper(substr($validated['name'], 0, 2));

        // Akun baru belum aktif: pemilik email harus memasukkan kode OTP yang dikirim ke emailnya.
        // Jika email gagal terkirim, pembuatan akun dibatalkan (tidak ada akun "hantu").
        $otp = app(OtpService::class);
        try {
            $user = DB::transaction(function () use ($validated, $initials, $otp) {
                $user = User::create([
                    'name' => $validated['name'],
                    'username' => $validated['username'],
                    'email' => $validated['email'],
                    'password' => Hash::make($validated['password']),
                    'role' => $validated['role'],
                    'status' => 'Menunggu Aktivasi',
                    'avatar_initials' => $initials,
                    'default_page' => User::getDefaultPageForRole($validated['role']),
                ]);
                $otp->issueActivation($user);

                return $user;
            });
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Akun gagal dibuat karena email OTP tidak dapat dikirim. Periksa alamat email lalu coba lagi.',
            ], 502);
        }

        AuditLog::record(
            'TAMBAH_PENGGUNA',
            "Super Admin menambahkan pengguna baru {$user->name} (@{$user->username}) dengan peran {$user->role}",
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => "Pengguna dibuat. Kode OTP aktivasi telah dikirim ke {$user->email}.",
            'requiresActivation' => true,
            'data' => $this->userPayload($user),
        ], 201);
    }

    /**
     * Update an existing user (FR-10 Edit Pengguna)
     */
    public function update(Request $request, $id): JsonResponse
    {
        $idUser = is_numeric($id) ? $id : (int) str_replace('usr-', '', $id);
        $user = User::findOrFail($idUser);

        $this->normalize($request);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'min:3', 'max:100', "regex:/^[\\pL][\\pL .'-]*$/u"],
            'username' => ['sometimes', 'string', 'min:5', 'max:30', 'regex:/^[a-z0-9._]+$/', Rule::unique('users', 'username')->ignore($user->id_user, 'id_user')],
            'email' => ['sometimes', 'string', 'max:254', 'email:rfc', Rule::unique('users', 'email')->ignore($user->id_user, 'id_user')],
            'password' => ['nullable', 'string', 'min:8', 'max:72', 'regex:/^(?=.*[A-Za-z])(?=.*\\d)\\S+$/'],
            'role' => ['sometimes', Rule::in(self::ROLES)],
            'status' => ['sometimes', Rule::in(['Aktif', 'Nonaktif'])],
        ], self::MESSAGES);

        // Akun yang menunggu aktivasi hanya boleh diaktifkan lewat OTP, bukan lewat edit status.
        if ($user->status === 'Menunggu Aktivasi' && isset($validated['status'])) {
            return response()->json([
                'success' => false,
                'message' => 'Akun ini belum diaktifkan oleh pemiliknya (menunggu verifikasi OTP).',
            ], 422);
        }

        if (isset($validated['name'])) {
            $user->name = $validated['name'];
            $user->avatar_initials = strtoupper(substr($validated['name'], 0, 2));
        }
        if (isset($validated['email'])) {
            $user->email = $validated['email'];
        }
        if (isset($validated['username'])) {
            $user->username = $validated['username'];
        }
        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }
        if (isset($validated['role'])) {
            $user->role = $validated['role'];
            $user->default_page = User::getDefaultPageForRole($validated['role']);
        }
        if (isset($validated['status'])) {
            $user->status = $validated['status'];
        }

        // [KEAMANAN] Super Admin tidak boleh menonaktifkan / menurunkan role akunnya sendiri.
        if ($request->user() && $user->id_user === $request->user()->id_user
            && ($user->role !== 'Super Admin' || $user->status !== 'Aktif')) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat menonaktifkan atau mengubah role akun Anda sendiri.',
            ], 422);
        }

        $user->save();

        // [KEAMANAN] Jika role, status, atau password berubah, paksa pengguna login ulang
        // (semua token lamanya dihapus) agar hak aksesnya langsung mengikuti data terbaru.
        if ($user->wasChanged(['role', 'status', 'password'])) {
            $user->tokens()->delete();
        }

        AuditLog::record(
            'EDIT_PENGGUNA',
            "Super Admin memperbarui data pengguna {$user->name} (@{$user->username})",
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Data pengguna berhasil diperbarui.',
            'data' => $this->userPayload($user),
        ]);
    }

    /**
     * Soft delete/deactivate user (FR-10 Hapus Pengguna)
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $idUser = is_numeric($id) ? $id : (int) str_replace('usr-', '', $id);
        $user = User::findOrFail($idUser);

        // [KEAMANAN] Super Admin tidak boleh menghapus akunnya sendiri.
        if ($request->user() && $user->id_user === $request->user()->id_user) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat menghapus akun Anda sendiri.',
            ], 422);
        }

        $user->status = 'Deleted';
        $user->save();

        // [KEAMANAN] Hapus semua token milik pengguna ini -> langsung ter-logout.
        $user->tokens()->delete();

        AuditLog::record(
            'HAPUS_PENGGUNA',
            "Super Admin menonaktifkan pengguna {$user->name} (@{$user->username})",
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Pengguna berhasil dihapus / dinonaktifkan.',
        ]);
    }
}

