<?php

namespace Database\Seeders;

use App\Models\StandardGizi;
use Illuminate\Database\Seeder;

class StandardGiziSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Table based on WHO Child Growth Standards (3-7 Years) from DPPL-0425 Gambar UI 05.A.
     */
    public function run(): void
    {
        $standards = [
            ['usia_bulan' => 36, 'usia_tahun' => 3, 'jenis_kelamin' => 'Laki-laki', 'mean_tinggi' => 96.1, 'sd_tinggi' => 3.70, 'mean_berat' => 14.3, 'sd_berat' => 1.8],
            ['usia_bulan' => 36, 'usia_tahun' => 3, 'jenis_kelamin' => 'Perempuan', 'mean_tinggi' => 95.1, 'sd_tinggi' => 3.90, 'mean_berat' => 13.9, 'sd_berat' => 1.9],
            ['usia_bulan' => 48, 'usia_tahun' => 4, 'jenis_kelamin' => 'Laki-laki', 'mean_tinggi' => 103.3, 'sd_tinggi' => 4.10, 'mean_berat' => 16.3, 'sd_berat' => 2.1],
            ['usia_bulan' => 48, 'usia_tahun' => 4, 'jenis_kelamin' => 'Perempuan', 'mean_tinggi' => 102.7, 'sd_tinggi' => 4.20, 'mean_berat' => 16.1, 'sd_berat' => 2.2],
            ['usia_bulan' => 60, 'usia_tahun' => 5, 'jenis_kelamin' => 'Laki-laki', 'mean_tinggi' => 110.0, 'sd_tinggi' => 4.30, 'mean_berat' => 18.3, 'sd_berat' => 2.4],
            ['usia_bulan' => 60, 'usia_tahun' => 5, 'jenis_kelamin' => 'Perempuan', 'mean_tinggi' => 109.4, 'sd_tinggi' => 4.50, 'mean_berat' => 18.2, 'sd_berat' => 2.5],
            ['usia_bulan' => 72, 'usia_tahun' => 6, 'jenis_kelamin' => 'Laki-laki', 'mean_tinggi' => 116.0, 'sd_tinggi' => 4.60, 'mean_berat' => 20.5, 'sd_berat' => 2.7],
            ['usia_bulan' => 72, 'usia_tahun' => 6, 'jenis_kelamin' => 'Perempuan', 'mean_tinggi' => 115.5, 'sd_tinggi' => 4.70, 'mean_berat' => 20.2, 'sd_berat' => 2.8],
            ['usia_bulan' => 84, 'usia_tahun' => 7, 'jenis_kelamin' => 'Laki-laki', 'mean_tinggi' => 122.0, 'sd_tinggi' => 5.00, 'mean_berat' => 22.9, 'sd_berat' => 3.1],
            ['usia_bulan' => 84, 'usia_tahun' => 7, 'jenis_kelamin' => 'Perempuan', 'mean_tinggi' => 121.8, 'sd_tinggi' => 5.20, 'mean_berat' => 22.4, 'sd_berat' => 3.2],
        ];

        foreach ($standards as $item) {
            StandardGizi::create($item);
        }
    }
}

