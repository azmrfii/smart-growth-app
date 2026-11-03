<?php

namespace Database\Seeders;

use App\Models\Anak;
use Illuminate\Database\Seeder;

class AnakSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $kids = [
            ['nama' => 'Ahmad Ridwan', 'kelas' => 'TK A1', 'jenis_kelamin' => 'Laki-laki', 'usia_bulan' => 68, 'usia_display' => '5th 8bln', 'tinggi_badan' => 95.0, 'berat_badan' => 11.5, 'status_gizi' => 'Gizi Buruk', 'alergi' => 'Telur'],
            ['nama' => 'Siti Aisyah', 'kelas' => 'TK A1', 'jenis_kelamin' => 'Perempuan', 'usia_bulan' => 66, 'usia_display' => '5th 6bln', 'tinggi_badan' => 102.0, 'berat_badan' => 15.5, 'status_gizi' => 'Gizi Baik', 'alergi' => '-'],
            ['nama' => 'Budi Santoso', 'kelas' => 'TK A1', 'jenis_kelamin' => 'Laki-laki', 'usia_bulan' => 70, 'usia_display' => '5th 10bln', 'tinggi_badan' => 104.0, 'berat_badan' => 19.5, 'status_gizi' => 'Gizi Lebih', 'alergi' => 'Kacang'],
            ['nama' => 'Dewi Lestari', 'kelas' => 'TK A1', 'jenis_kelamin' => 'Perempuan', 'usia_bulan' => 64, 'usia_display' => '5th 4bln', 'tinggi_badan' => 100.0, 'berat_badan' => 15.0, 'status_gizi' => 'Gizi Baik', 'alergi' => '-'],
            ['nama' => 'Farhan Maulana', 'kelas' => 'TK A1', 'jenis_kelamin' => 'Laki-laki', 'usia_bulan' => 69, 'usia_display' => '5th 9bln', 'tinggi_badan' => 98.0, 'berat_badan' => 13.2, 'status_gizi' => 'Gizi Kurang', 'alergi' => 'Susu Sapi'],
            ['nama' => 'Zahra Amalia', 'kelas' => 'TK A1', 'jenis_kelamin' => 'Perempuan', 'usia_bulan' => 62, 'usia_display' => '5th 2bln', 'tinggi_badan' => 101.0, 'berat_badan' => 16.0, 'status_gizi' => 'Gizi Baik', 'alergi' => '-'],
            ['nama' => 'Rizki Pratama', 'kelas' => 'TK A1', 'jenis_kelamin' => 'Laki-laki', 'usia_bulan' => 67, 'usia_display' => '5th 7bln', 'tinggi_badan' => 103.0, 'berat_badan' => 21.0, 'status_gizi' => 'Obesitas', 'alergi' => '-'],
            ['nama' => 'Aisyah Putri', 'kelas' => 'TK A2', 'jenis_kelamin' => 'Perempuan', 'usia_bulan' => 54, 'usia_display' => '4th 6bln', 'tinggi_badan' => 102.0, 'berat_badan' => 16.5, 'status_gizi' => 'Gizi Baik', 'alergi' => 'Kacang'],
            ['nama' => 'Bima Saputra', 'kelas' => 'TK B1', 'jenis_kelamin' => 'Laki-laki', 'usia_bulan' => 61, 'usia_display' => '5th 1bln', 'tinggi_badan' => 106.0, 'berat_badan' => 13.0, 'status_gizi' => 'Gizi Buruk', 'alergi' => '-'],
            ['nama' => 'Citra Lestari', 'kelas' => 'TK A2', 'jenis_kelamin' => 'Perempuan', 'usia_bulan' => 44, 'usia_display' => '3th 8bln', 'tinggi_badan' => 92.0, 'berat_badan' => 10.8, 'status_gizi' => 'Gizi Buruk', 'alergi' => 'Susu Sapi'],
            ['nama' => 'Dimas Pratama', 'kelas' => 'TK B1', 'jenis_kelamin' => 'Laki-laki', 'usia_bulan' => 74, 'usia_display' => '6th 2bln', 'tinggi_badan' => 113.0, 'berat_badan' => 15.9, 'status_gizi' => 'Gizi Kurang', 'alergi' => '-'],
            ['nama' => 'Eka Wulandari', 'kelas' => 'TK A1', 'jenis_kelamin' => 'Perempuan', 'usia_bulan' => 53, 'usia_display' => '4th 5bln', 'tinggi_badan' => 99.0, 'berat_badan' => 14.0, 'status_gizi' => 'Gizi Kurang', 'alergi' => 'Telur'],
            ['nama' => 'Fajar Nugroho', 'kelas' => 'TK B2', 'jenis_kelamin' => 'Laki-laki', 'usia_bulan' => 63, 'usia_display' => '5th 3bln', 'tinggi_badan' => 108.0, 'berat_badan' => 15.2, 'status_gizi' => 'Gizi Kurang', 'alergi' => '-'],
            ['nama' => 'Gita Anindya', 'kelas' => 'TK A2', 'jenis_kelamin' => 'Perempuan', 'usia_bulan' => 47, 'usia_display' => '3th 11bln', 'tinggi_badan' => 95.0, 'berat_badan' => 12.6, 'status_gizi' => 'Gizi Kurang', 'alergi' => '-'],
            ['nama' => 'Hafiz Ramadhan', 'kelas' => 'TK B1', 'jenis_kelamin' => 'Laki-laki', 'usia_bulan' => 76, 'usia_display' => '6th 4bln', 'tinggi_badan' => 116.0, 'berat_badan' => 20.4, 'status_gizi' => 'Gizi Baik', 'alergi' => 'Udang'],
            ['nama' => 'Indah Permata', 'kelas' => 'TK A1', 'jenis_kelamin' => 'Perempuan', 'usia_bulan' => 57, 'usia_display' => '4th 9bln', 'tinggi_badan' => 101.0, 'berat_badan' => 15.1, 'status_gizi' => 'Gizi Baik', 'alergi' => '-'],
            ['nama' => 'Joni Kurniawan', 'kelas' => 'TK B2', 'jenis_kelamin' => 'Laki-laki', 'usia_bulan' => 84, 'usia_display' => '7th 0bln', 'tinggi_badan' => 121.0, 'berat_badan' => 21.0, 'status_gizi' => 'Gizi Baik', 'alergi' => '-'],
            ['nama' => 'Kirana Sari', 'kelas' => 'TK A2', 'jenis_kelamin' => 'Perempuan', 'usia_bulan' => 65, 'usia_display' => '5th 5bln', 'tinggi_badan' => 109.0, 'berat_badan' => 17.3, 'status_gizi' => 'Gizi Baik', 'alergi' => 'Kacang'],
            ['nama' => 'Laras Ayu', 'kelas' => 'TK B1', 'jenis_kelamin' => 'Perempuan', 'usia_bulan' => 73, 'usia_display' => '6th 1bln', 'tinggi_badan' => 114.0, 'berat_badan' => 18.6, 'status_gizi' => 'Gizi Baik', 'alergi' => '-'],
            ['nama' => 'Mahesa Putra', 'kelas' => 'TK A1', 'jenis_kelamin' => 'Laki-laki', 'usia_bulan' => 51, 'usia_display' => '4th 3bln', 'tinggi_badan' => 100.0, 'berat_badan' => 15.8, 'status_gizi' => 'Gizi Baik', 'alergi' => '-'],
            ['nama' => 'Nadia Safitri', 'kelas' => 'TK B2', 'jenis_kelamin' => 'Perempuan', 'usia_bulan' => 77, 'usia_display' => '6th 5bln', 'tinggi_badan' => 115.0, 'berat_badan' => 19.2, 'status_gizi' => 'Gizi Baik', 'alergi' => '-'],
            ['nama' => 'Omar Faruq', 'kelas' => 'TK A2', 'jenis_kelamin' => 'Laki-laki', 'usia_bulan' => 43, 'usia_display' => '3th 7bln', 'tinggi_badan' => 94.0, 'berat_badan' => 13.9, 'status_gizi' => 'Gizi Baik', 'alergi' => 'Susu Sapi'],
            ['Putri Maharani', 'TK B1', 'Perempuan', 85, '7th 1bln', 120.0, 22.1, 'Gizi Baik', '-'],
            ['Qori Ramadhani', 'TK A1', 'Perempuan', 55, '4th 7bln', 102.0, 16.0, 'Gizi Baik', '-'],
            ['Rafi Alfarizi', 'TK B2', 'Laki-laki', 66, '5th 6bln', 110.0, 17.8, 'Gizi Baik', 'Ikan'],
            ['Sinta Dewi', 'TK A2', 'Perempuan', 60, '5th 0bln', 107.0, 16.5, 'Gizi Baik', '-'],
            ['Tegar Wibowo', 'TK B1', 'Laki-laki', 80, '6th 8bln', 117.0, 19.8, 'Gizi Baik', '-'],
            ['Ulfa Hanifah', 'TK A1', 'Perempuan', 45, '3th 9bln', 96.0, 14.4, 'Gizi Baik', '-'],
            ['Vino Hidayat', 'TK B2', 'Laki-laki', 86, '7th 2bln', 122.0, 23.4, 'Gizi Baik', '-'],
            ['Wulan Sari', 'TK A2', 'Perempuan', 52, '4th 4bln', 100.0, 15.4, 'Gizi Baik', '-'],
        ];

        foreach ($kids as $k) {
            if (is_array($k) && isset($k['nama'])) {
                Anak::create($k);
            } else {
                Anak::create([
                    'nama' => $k[0],
                    'kelas' => $k[1],
                    'jenis_kelamin' => $k[2],
                    'usia_bulan' => $k[3],
                    'usia_display' => $k[4],
                    'tinggi_badan' => $k[5],
                    'berat_badan' => $k[6],
                    'status_gizi' => $k[7],
                    'alergi' => $k[8],
                ]);
            }
        }
    }
}

