<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'users';
    protected $primaryKey = 'id_user';

    protected $fillable = [
        'name',
        'username',
        'password',
        'role',
        'status',
        'avatar_initials',
        'default_page',
        'api_token',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    /**
     * Get sidebar navigation menu items specifically permitted for this user's role.
     * Matches the React frontend routes and roles exactly.
     */
    public function getPermittedNavItems(): array
    {
        $allNavItems = [
            [
                'to' => '/kelola-pengguna',
                'label' => 'Kelola Pengguna',
                'icon' => 'IconUserShield',
                'roles' => ['Super Admin'],
                'description' => 'Mengelola data pengguna sistem dan hak akses akun',
            ],
            [
                'to' => '/data-anak',
                'label' => 'Data Anak',
                'icon' => 'IconUsers',
                'roles' => ['Tata Usaha'],
                'description' => 'Kelola data anak termasuk informasi fisik dan alergi',
            ],
            [
                'to' => '/laporan-menu',
                'label' => 'Laporan Menu',
                'icon' => 'IconFileText',
                'roles' => ['Admin dapur MBG'],
                'description' => 'Akses dan unduh laporan menu mingguan yang telah disetujui',
            ],
            [
                'to' => '/standar-gizi',
                'label' => 'Standar Gizi',
                'icon' => 'IconRuler2',
                'roles' => ['Ahli Gizi'],
                'description' => 'Acuan kategori status gizi anak sebagai dasar perhitungan',
            ],
            [
                'to' => '/status-gizi',
                'label' => 'Status Gizi',
                'icon' => 'IconHeartRateMonitor',
                'roles' => ['Admin dapur MBG', 'Ahli Gizi'],
                'description' => 'Ringkasan distribusi status gizi anak terdaftar',
            ],
            [
                'to' => '/rekomendasi-menu',
                'label' => 'Rekomendasi Menu',
                'icon' => 'IconWand',
                'roles' => ['Ahli Gizi'],
                'description' => 'Buat rekomendasi menu mingguan berdasarkan kebutuhan nutrisi anak',
            ],
        ];

        return array_values(array_filter($allNavItems, function ($item) {
            return in_array($this->role, $item['roles'], true);
        }));
    }

    /**
     * Map default landing page by role.
     */
    public static function getDefaultPageForRole(string $role): string
    {
        return match ($role) {
            'Super Admin' => '/kelola-pengguna',
            'Tata Usaha' => '/data-anak',
            'Admin dapur MBG' => '/laporan-menu',
            'Ahli Gizi' => '/rekomendasi-menu',
            default => '/data-anak',
        };
    }
}

