<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            [
                'id_user' => 1,
                'name' => 'Dimas Vikriansyah',
                'username' => 'dimas_vikrian',
                'password' => Hash::make('password123'),
                'role' => 'Super Admin',
                'status' => 'Aktif',
                'avatar_initials' => 'DV',
                'default_page' => '/kelola-pengguna',
            ],
            [
                'id_user' => 2,
                'name' => 'Siti Aminah',
                'username' => 'siti_aminah',
                'password' => Hash::make('password123'),
                'role' => 'Tata Usaha',
                'status' => 'Aktif',
                'avatar_initials' => 'SA',
                'default_page' => '/data-anak',
            ],
            [
                'id_user' => 3,
                'name' => 'Dr. Ratna Dewi',
                'username' => 'ratna_dewi',
                'password' => Hash::make('password123'),
                'role' => 'Ahli Gizi',
                'status' => 'Aktif',
                'avatar_initials' => 'RD',
                'default_page' => '/rekomendasi-menu',
            ],
            [
                'id_user' => 4,
                'name' => 'Budi Santoso',
                'username' => 'budi_santoso',
                'password' => Hash::make('password123'),
                'role' => 'Admin dapur MBG',
                'status' => 'Aktif',
                'avatar_initials' => 'BS',
                'default_page' => '/laporan-menu',
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['username' => $userData['username']],
                $userData
            );
        }
    }
}

