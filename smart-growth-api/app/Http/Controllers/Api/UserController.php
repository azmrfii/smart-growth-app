<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
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

        $users = $query->orderBy('name')->get()->map(function ($u) {
            return [
                'id' => "usr-{$u->id_user}",
                'id_user' => $u->id_user,
                'name' => $u->name,
                'username' => $u->username,
                'role' => $u->role,
                'status' => $u->status,
                'initials' => $u->avatar_initials ?: strtoupper(substr($u->name, 0, 2)),
                'createdAt' => $u->created_at ? $u->created_at->translatedFormat('d M Y') : '10 Jan 2025',
            ];
        });

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
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|min:5|unique:users,username|regex:/^\S*$/',
            'password' => 'required|string|min:8',
            'role' => 'required|in:Super Admin,Tata Usaha,Admin dapur MBG,Ahli Gizi',
        ], [
            'username.regex' => 'Username tidak boleh mengandung spasi.',
            'username.min' => 'Username minimal 5 karakter.',
            'password.min' => 'Password minimal 8 karakter.',
            'username.unique' => 'Username sudah digunakan oleh akun lain.',
        ]);

        $initials = strtoupper(substr($validated['name'], 0, 2));

        $user = User::create([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'status' => 'Aktif',
            'avatar_initials' => $initials,
            'default_page' => User::getDefaultPageForRole($validated['role']),
        ]);

        AuditLog::record(
            'TAMBAH_PENGGUNA',
            "Super Admin menambahkan pengguna baru {$user->name} (@{$user->username}) dengan peran {$user->role}",
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Pengguna baru berhasil ditambahkan.',
            'data' => [
                'id' => "usr-{$user->id_user}",
                'id_user' => $user->id_user,
                'name' => $user->name,
                'username' => $user->username,
                'role' => $user->role,
                'status' => $user->status,
                'initials' => $initials,
                'createdAt' => now()->translatedFormat('d M Y'),
            ],
        ], 201);
    }

    /**
     * Update an existing user (FR-10 Edit Pengguna)
     */
    public function update(Request $request, $id): JsonResponse
    {
        $idUser = is_numeric($id) ? $id : (int) str_replace('usr-', '', $id);
        $user = User::findOrFail($idUser);

        $validated = $request->validate([
            'username' => 'sometimes|string|min:5|unique:users,username,' . $user->id_user . ',id_user|regex:/^\S*$/',
            'password' => 'nullable|string|min:8',
            'role' => 'sometimes|in:Super Admin,Tata Usaha,Admin dapur MBG,Ahli Gizi',
            'status' => 'sometimes|in:Aktif,Nonaktif',
        ]);

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

        $user->save();

        AuditLog::record(
            'EDIT_PENGGUNA',
            "Super Admin memperbarui data pengguna {$user->name} (@{$user->username})",
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Data pengguna berhasil diperbarui.',
            'data' => [
                'id' => "usr-{$user->id_user}",
                'id_user' => $user->id_user,
                'name' => $user->name,
                'username' => $user->username,
                'role' => $user->role,
                'status' => $user->status,
                'initials' => $user->avatar_initials ?: strtoupper(substr($user->name, 0, 2)),
                'createdAt' => $user->created_at ? $user->created_at->translatedFormat('d M Y') : '10 Jan 2025',
            ],
        ]);
    }

    /**
     * Soft delete/deactivate user (FR-10 Hapus Pengguna)
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $idUser = is_numeric($id) ? $id : (int) str_replace('usr-', '', $id);
        $user = User::findOrFail($idUser);

        $user->status = 'Deleted';
        $user->api_token = null;
        $user->save();

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

