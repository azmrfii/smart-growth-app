<?php

namespace Database\Seeders;

use App\Models\LaporanMenu;
use App\Models\MenuMakanan;
use App\Models\RekomendasiMenu;
use Illuminate\Database\Seeder;

class MenuMakananSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $foods = [
            ['id_makanan' => 'food-dada-ayam', 'nama_makanan' => 'Dada Ayam', 'kategori' => 'Protein', 'kalori' => 165, 'protein' => 31.0, 'karbohidrat' => 0.0, 'lemak' => 3.6, 'alergen' => '-'],
            ['id_makanan' => 'food-nasi-putih', 'nama_makanan' => 'Nasi Putih', 'kategori' => 'Karbohidrat', 'kalori' => 195, 'protein' => 4.0, 'karbohidrat' => 43.0, 'lemak' => 0.4, 'alergen' => '-'],
            ['id_makanan' => 'food-brokoli', 'nama_makanan' => 'Brokoli', 'kategori' => 'Sayur', 'kalori' => 34, 'protein' => 2.8, 'karbohidrat' => 7.0, 'lemak' => 0.4, 'alergen' => '-'],
            ['id_makanan' => 'food-wortel', 'nama_makanan' => 'Wortel', 'kategori' => 'Sayur', 'kalori' => 41, 'protein' => 0.9, 'karbohidrat' => 10.0, 'lemak' => 0.2, 'alergen' => '-'],
            ['id_makanan' => 'food-tempe-goreng', 'nama_makanan' => 'Tempe Goreng', 'kategori' => 'Protein', 'kalori' => 193, 'protein' => 19.0, 'karbohidrat' => 9.0, 'lemak' => 11.0, 'alergen' => 'Kedelai'],
            ['id_makanan' => 'food-telur-rebus', 'nama_makanan' => 'Telur Rebus', 'kategori' => 'Protein', 'kalori' => 155, 'protein' => 13.0, 'karbohidrat' => 1.1, 'lemak' => 11.0, 'alergen' => 'Telur'],
            ['id_makanan' => 'food-ikan-salmon', 'nama_makanan' => 'Ikan Salmon', 'kategori' => 'Protein', 'kalori' => 208, 'protein' => 20.0, 'karbohidrat' => 0.0, 'lemak' => 13.0, 'alergen' => 'Ikan'],
            ['id_makanan' => 'food-pisang', 'nama_makanan' => 'Pisang', 'kategori' => 'Buah', 'kalori' => 105, 'protein' => 1.3, 'karbohidrat' => 27.0, 'lemak' => 0.4, 'alergen' => '-'],
        ];

        foreach ($foods as $food) {
            MenuMakanan::updateOrCreate(['id_makanan' => $food['id_makanan']], $food);
        }

        // Weekly menus matching Frontend SEED_MENUS
        $menus = [
            [
                'id_rekomendasi' => 'menu-submitted-1',
                'title' => 'Menu Submitted - 2025-11-25',
                'status' => 'submitted',
                'created_by' => 'Dr. Ratna Dewi (ahli gizi)',
                'approved_by_id' => 3,
                'approved_by_name' => 'Dr. Ratna Dewi',
                'approved_at' => '2025-11-25 16:41:00',
                'waktu_dibuat' => '16.41',
                'total_kalori' => 435.0,
                'total_protein' => 38.7,
                'total_karbohidrat' => 60.0,
                'total_lemak' => 4.6,
                'catatan_ahli_gizi' => 'Menu makan siang seimbang dengan fokus pemulihan stunting.',
                'days_menu' => [
                    'Senin' => ['food-dada-ayam', 'food-nasi-putih', 'food-brokoli', 'food-wortel'],
                    'Selasa' => ['food-telur-rebus', 'food-nasi-putih', 'food-tempe-goreng'],
                    'Rabu' => ['food-ikan-salmon', 'food-nasi-putih', 'food-brokoli'],
                    'Kamis' => ['food-dada-ayam', 'food-nasi-putih', 'food-wortel'],
                    'Jumat' => ['food-telur-rebus', 'food-nasi-putih', 'food-pisang'],
                ],
            ],
            [
                'id_rekomendasi' => 'menu-draft-1',
                'title' => 'Menu Draft - 2025-11-25',
                'status' => 'draft',
                'created_by' => 'Dr. Ratna Dewi (ahli gizi)',
                'approved_by_id' => null,
                'approved_by_name' => null,
                'approved_at' => null,
                'waktu_dibuat' => '16.41',
                'total_kalori' => 388.0,
                'total_protein' => 23.0,
                'total_karbohidrat' => 52.0,
                'total_lemak' => 11.4,
                'catatan_ahli_gizi' => 'Draf menu cadangan untuk evaluasi.',
                'days_menu' => [
                    'Senin' => ['food-nasi-putih', 'food-tempe-goreng'],
                    'Selasa' => [],
                    'Rabu' => [],
                    'Kamis' => [],
                    'Jumat' => [],
                ],
            ],
        ];

        foreach ($menus as $m) {
            RekomendasiMenu::updateOrCreate(['id_rekomendasi' => $m['id_rekomendasi']], $m);
        }

        // Laporan Menu
        $reports = [
            [
                'id_laporan' => 'rep-1',
                'id_rekomendasi' => 'menu-submitted-1',
                'tanggal' => '2025-11-25',
                'waktu' => '16.41',
                'dibuat_oleh' => 'Dr. Ratna Dewi',
                'peran' => 'Ahli Gizi',
                'periode' => 'Minggu ke-4 November 2025 (25 - 29 Nov 2025)',
                'total_porsi' => 120,
                'status' => 'Disetujui',
                'file_download' => 'Laporan_Menu_Minggu4_Nov2025.pdf',
            ],
            [
                'id_laporan' => 'rep-2',
                'id_rekomendasi' => null,
                'tanggal' => '2025-11-18',
                'waktu' => '15.30',
                'dibuat_oleh' => 'Dr. Ratna Dewi',
                'peran' => 'Ahli Gizi',
                'periode' => 'Minggu ke-3 November 2025 (18 - 22 Nov 2025)',
                'total_porsi' => 120,
                'status' => 'Disetujui',
                'file_download' => 'Laporan_Menu_Minggu3_Nov2025.pdf',
            ],
            [
                'id_laporan' => 'rep-3',
                'id_rekomendasi' => null,
                'tanggal' => '2025-11-11',
                'waktu' => '14.15',
                'dibuat_oleh' => 'Dr. Ratna Dewi',
                'peran' => 'Ahli Gizi',
                'periode' => 'Minggu ke-2 November 2025 (11 - 15 Nov 2025)',
                'total_porsi' => 120,
                'status' => 'Disetujui',
                'file_download' => 'Laporan_Menu_Minggu2_Nov2025.pdf',
            ],
        ];

        foreach ($reports as $rep) {
            LaporanMenu::updateOrCreate(['id_laporan' => $rep['id_laporan']], $rep);
        }
    }
}

