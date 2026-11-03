-- =====================================================================
-- Database Schema and Seed Data for Smart Growth API (MySQL)
-- Sistem Deteksi dan Rekomendasi Menu Gizi Anak (Smart Growth)
-- Sesuai Dokumen SKPL-0425 & DPPL-0425
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `smart_growth` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `smart_growth`;

-- --------------------------------------------------------
-- Table: users (CL-01 User)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id_user` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('Super Admin','Tata Usaha','Admin dapur MBG','Ahli Gizi') NOT NULL DEFAULT 'Tata Usaha',
  `status` enum('Aktif','Nonaktif','Deleted') NOT NULL DEFAULT 'Aktif',
  `avatar_initials` varchar(10) DEFAULT NULL,
  `default_page` varchar(255) NOT NULL DEFAULT '/data-anak',
  `api_token` varchar(80) DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_user`),
  UNIQUE KEY `users_username_unique` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initial Users (Password: password123 via bcrypt)
INSERT INTO `users` (`id_user`, `name`, `username`, `password`, `role`, `status`, `avatar_initials`, `default_page`, `created_at`, `updated_at`) VALUES
(1, 'Dimas Vikriansyah', 'dimas_vikrian', '$2y$12$lO/ZqOa8dYp9MfqFh3sD.uWjXgO/6o2r4c1l1s5.wN4wPqBvY2uC.', 'Super Admin', 'Aktif', 'DV', '/kelola-pengguna', NOW(), NOW()),
(2, 'Siti Aminah', 'siti_aminah', '$2y$12$lO/ZqOa8dYp9MfqFh3sD.uWjXgO/6o2r4c1l1s5.wN4wPqBvY2uC.', 'Tata Usaha', 'Aktif', 'SA', '/data-anak', NOW(), NOW()),
(3, 'Dr. Ratna Dewi', 'ratna_dewi', '$2y$12$lO/ZqOa8dYp9MfqFh3sD.uWjXgO/6o2r4c1l1s5.wN4wPqBvY2uC.', 'Ahli Gizi', 'Aktif', 'RD', '/rekomendasi-menu', NOW(), NOW()),
(4, 'Budi Santoso', 'budi_santoso', '$2y$12$lO/ZqOa8dYp9MfqFh3sD.uWjXgO/6o2r4c1l1s5.wN4wPqBvY2uC.', 'Admin dapur MBG', 'Aktif', 'BS', '/laporan-menu', NOW(), NOW());

-- --------------------------------------------------------
-- Table: standard_gizi (CL-03 StandardGizi - WHO Z-Score 3-7 Tahun)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `standard_gizi`;
CREATE TABLE `standard_gizi` (
  `id_standar` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `usia_bulan` int(11) NOT NULL,
  `usia_tahun` int(11) NOT NULL,
  `jenis_kelamin` enum('Laki-laki','Perempuan') NOT NULL,
  `mean_tinggi` decimal(5,2) NOT NULL,
  `sd_tinggi` decimal(5,2) NOT NULL,
  `mean_berat` decimal(5,2) NOT NULL DEFAULT 15.00,
  `sd_berat` decimal(5,2) NOT NULL DEFAULT 2.00,
  `kebutuhan_kalori` int(11) NOT NULL DEFAULT 1400,
  `kebutuhan_protein` int(11) NOT NULL DEFAULT 25,
  `kebutuhan_karbohidrat` int(11) NOT NULL DEFAULT 180,
  `kebutuhan_lemak` int(11) NOT NULL DEFAULT 45,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_standar`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `standard_gizi` (`id_standar`, `usia_bulan`, `usia_tahun`, `jenis_kelamin`, `mean_tinggi`, `sd_tinggi`, `mean_berat`, `sd_berat`, `kebutuhan_kalori`, `kebutuhan_protein`, `kebutuhan_karbohidrat`, `kebutuhan_lemak`) VALUES
(1, 36, 3, 'Laki-laki', 96.10, 3.70, 14.30, 1.80, 1200, 20, 160, 40),
(2, 36, 3, 'Perempuan', 95.10, 3.90, 13.90, 1.90, 1150, 20, 155, 38),
(3, 48, 4, 'Laki-laki', 103.30, 4.10, 16.30, 2.10, 1350, 25, 175, 45),
(4, 48, 4, 'Perempuan', 102.70, 4.20, 16.10, 2.20, 1300, 25, 170, 42),
(5, 60, 5, 'Laki-laki', 110.00, 4.30, 18.30, 2.40, 1500, 30, 190, 50),
(6, 60, 5, 'Perempuan', 109.40, 4.50, 18.20, 2.50, 1450, 30, 185, 48),
(7, 72, 6, 'Laki-laki', 116.00, 4.60, 20.50, 2.70, 1650, 35, 210, 55),
(8, 72, 6, 'Perempuan', 115.50, 4.70, 20.20, 2.80, 1600, 35, 205, 52),
(9, 84, 7, 'Laki-laki', 122.00, 5.00, 22.90, 3.10, 1800, 40, 230, 60),
(10, 84, 7, 'Perempuan', 121.80, 5.20, 22.40, 3.20, 1750, 40, 225, 58);

-- --------------------------------------------------------
-- Table: anak (CL-02 Anak)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `anak`;
CREATE TABLE `anak` (
  `id_anak` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `nama` varchar(255) NOT NULL,
  `kelas` varchar(50) NOT NULL DEFAULT 'TK A1',
  `jenis_kelamin` enum('Laki-laki','Perempuan') NOT NULL DEFAULT 'Laki-laki',
  `tanggal_lahir` date DEFAULT NULL,
  `usia_bulan` int(11) NOT NULL DEFAULT 60,
  `usia_display` varchar(50) NOT NULL DEFAULT '5th 0bln',
  `tinggi_badan` decimal(5,2) NOT NULL,
  `berat_badan` decimal(5,2) NOT NULL,
  `alergi` varchar(255) NOT NULL DEFAULT '-',
  `status_gizi` varchar(50) NOT NULL DEFAULT 'Gizi Baik',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_anak`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `anak` (`id_anak`, `nama`, `kelas`, `jenis_kelamin`, `usia_bulan`, `usia_display`, `tinggi_badan`, `berat_badan`, `alergi`, `status_gizi`) VALUES
(1, 'Ahmad Ridwan', 'TK A1', 'Laki-laki', 68, '5th 8bln', 95.00, 11.50, 'Telur', 'Gizi Buruk'),
(2, 'Siti Aisyah', 'TK A1', 'Perempuan', 66, '5th 6bln', 102.00, 15.50, '-', 'Gizi Baik'),
(3, 'Budi Santoso', 'TK A1', 'Laki-laki', 70, '5th 10bln', 104.00, 19.50, 'Kacang', 'Gizi Lebih'),
(4, 'Dewi Lestari', 'TK A1', 'Perempuan', 64, '5th 4bln', 100.00, 15.00, '-', 'Gizi Baik'),
(5, 'Farhan Maulana', 'TK A1', 'Laki-laki', 69, '5th 9bln', 98.00, 13.20, 'Susu Sapi', 'Gizi Kurang'),
(6, 'Zahra Amalia', 'TK A1', 'Perempuan', 62, '5th 2bln', 101.00, 16.00, '-', 'Gizi Baik'),
(7, 'Rizki Pratama', 'TK A1', 'Laki-laki', 67, '5th 7bln', 103.00, 21.00, '-', 'Obesitas'),
(8, 'Aisyah Putri', 'TK A2', 'Perempuan', 54, '4th 6bln', 102.00, 16.50, 'Kacang', 'Gizi Baik'),
(9, 'Bima Saputra', 'TK B1', 'Laki-laki', 61, '5th 1bln', 106.00, 13.00, '-', 'Gizi Buruk'),
(10, 'Citra Lestari', 'TK A2', 'Perempuan', 44, '3th 8bln', 92.00, 10.80, 'Susu Sapi', 'Gizi Buruk'),
(11, 'Dimas Pratama', 'TK B1', 'Laki-laki', 74, '6th 2bln', 113.00, 15.90, '-', 'Gizi Kurang'),
(12, 'Eka Wulandari', 'TK A1', 'Perempuan', 53, '4th 5bln', 99.00, 14.00, 'Telur', 'Gizi Kurang'),
(13, 'Fajar Nugroho', 'TK B2', 'Laki-laki', 63, '5th 3bln', 108.00, 15.20, '-', 'Gizi Kurang'),
(14, 'Gita Anindya', 'TK A2', 'Perempuan', 47, '3th 11bln', 95.00, 12.60, '-', 'Gizi Kurang'),
(15, 'Hafiz Ramadhan', 'TK B1', 'Laki-laki', 76, '6th 4bln', 116.00, 20.40, 'Udang', 'Gizi Baik'),
(16, 'Indah Permata', 'TK A1', 'Perempuan', 57, '4th 9bln', 101.00, 15.10, '-', 'Gizi Baik'),
(17, 'Joni Kurniawan', 'TK B2', 'Laki-laki', 84, '7th 0bln', 121.00, 21.00, '-', 'Gizi Baik'),
(18, 'Kirana Sari', 'TK A2', 'Perempuan', 65, '5th 5bln', 109.00, 17.30, 'Kacang', 'Gizi Baik'),
(19, 'Laras Ayu', 'TK B1', 'Perempuan', 73, '6th 1bln', 114.00, 18.60, '-', 'Gizi Baik'),
(20, 'Mahesa Putra', 'TK A1', 'Laki-laki', 51, '4th 3bln', 100.00, 15.80, '-', 'Gizi Baik'),
(21, 'Nadia Safitri', 'TK B2', 'Perempuan', 77, '6th 5bln', 115.00, 19.20, '-', 'Gizi Baik'),
(22, 'Omar Faruq', 'TK A2', 'Laki-laki', 43, '3th 7bln', 94.00, 13.90, 'Susu Sapi', 'Gizi Baik'),
(23, 'Putri Maharani', 'TK B1', 'Perempuan', 85, '7th 1bln', 120.00, 22.10, '-', 'Gizi Baik'),
(24, 'Qori Ramadhani', 'TK A1', 'Perempuan', 55, '4th 7bln', 102.00, 16.00, '-', 'Gizi Baik'),
(25, 'Rafi Alfarizi', 'TK B2', 'Laki-laki', 66, '5th 6bln', 110.00, 17.80, 'Ikan', 'Gizi Baik'),
(26, 'Sinta Dewi', 'TK A2', 'Perempuan', 60, '5th 0bln', 107.00, 16.50, '-', 'Gizi Baik'),
(27, 'Tegar Wibowo', 'TK B1', 'Laki-laki', 80, '6th 8bln', 117.00, 19.80, '-', 'Gizi Baik'),
(28, 'Ulfa Hanifah', 'TK A1', 'Perempuan', 45, '3th 9bln', 96.00, 14.40, '-', 'Gizi Baik'),
(29, 'Vino Hidayat', 'TK B2', 'Laki-laki', 86, '7th 2bln', 122.00, 23.40, '-', 'Gizi Baik'),
(30, 'Wulan Sari', 'TK A2', 'Perempuan', 52, '4th 4bln', 100.00, 15.40, '-', 'Gizi Baik');

-- --------------------------------------------------------
-- Table: status_gizi (CL-04 StatusGizi)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `status_gizi`;
CREATE TABLE `status_gizi` (
  `id_pengukuran` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_anak` bigint(20) UNSIGNED NOT NULL,
  `tanggal_pengukuran` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tinggi_badan` decimal(5,2) NOT NULL,
  `berat_badan` decimal(5,2) NOT NULL,
  `bmi` decimal(4,1) DEFAULT NULL,
  `zscore_tb_u` decimal(4,2) NOT NULL DEFAULT 0.00,
  `zscore_bb_u` decimal(4,2) NOT NULL DEFAULT 0.00,
  `zscore_bb_tb` decimal(4,2) NOT NULL DEFAULT 0.00,
  `status_gizi` varchar(50) NOT NULL,
  `interpretasi` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_pengukuran`),
  KEY `status_gizi_id_anak_foreign` (`id_anak`),
  CONSTRAINT `status_gizi_id_anak_foreign` FOREIGN KEY (`id_anak`) REFERENCES `anak` (`id_anak`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: menu_makanan (CL-05 Menu Makanan / Ingredients)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `menu_makanan`;
CREATE TABLE `menu_makanan` (
  `id_makanan` varchar(50) NOT NULL,
  `nama_makanan` varchar(255) NOT NULL,
  `kategori` varchar(50) NOT NULL DEFAULT 'Protein',
  `kalori` decimal(6,1) NOT NULL DEFAULT 0.0,
  `protein` decimal(5,1) NOT NULL DEFAULT 0.0,
  `karbohidrat` decimal(5,1) NOT NULL DEFAULT 0.0,
  `lemak` decimal(5,1) NOT NULL DEFAULT 0.0,
  `alergen` varchar(255) NOT NULL DEFAULT '-',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_makanan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `menu_makanan` (`id_makanan`, `nama_makanan`, `kategori`, `kalori`, `protein`, `karbohidrat`, `lemak`, `alergen`) VALUES
('food-dada-ayam', 'Dada Ayam', 'Protein', 165.0, 31.0, 0.0, 3.6, '-'),
('food-nasi-putih', 'Nasi Putih', 'Karbohidrat', 195.0, 4.0, 43.0, 0.4, '-'),
('food-brokoli', 'Brokoli', 'Sayur', 34.0, 2.8, 7.0, 0.4, '-'),
('food-wortel', 'Wortel', 'Sayur', 41.0, 0.9, 10.0, 0.2, '-'),
('food-tempe-goreng', 'Tempe Goreng', 'Protein', 193.0, 19.0, 9.0, 11.0, 'Kedelai'),
('food-telur-rebus', 'Telur Rebus', 'Protein', 155.0, 13.0, 1.1, 11.0, 'Telur'),
('food-ikan-salmon', 'Ikan Salmon', 'Protein', 208.0, 20.0, 0.0, 13.0, 'Ikan'),
('food-pisang', 'Pisang', 'Buah', 105.0, 1.3, 27.0, 0.4, '-');

-- --------------------------------------------------------
-- Table: rekomendasi_menu (CL-06 RekomendasiHarian / Weekly Menu)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `rekomendasi_menu`;
CREATE TABLE `rekomendasi_menu` (
  `id_rekomendasi` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `status` enum('draft','submitted','approved') NOT NULL DEFAULT 'draft',
  `created_by` varchar(255) NOT NULL DEFAULT 'Dr. Ratna Dewi (ahli gizi)',
  `approved_by_id` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_by_name` varchar(255) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `waktu_dibuat` varchar(20) NOT NULL DEFAULT '16.41',
  `days_menu` json NOT NULL,
  `total_kalori` decimal(6,1) NOT NULL DEFAULT 0.0,
  `total_protein` decimal(5,1) NOT NULL DEFAULT 0.0,
  `total_karbohidrat` decimal(5,1) NOT NULL DEFAULT 0.0,
  `total_lemak` decimal(5,1) NOT NULL DEFAULT 0.0,
  `catatan_ahli_gizi` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_rekomendasi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `rekomendasi_menu` (`id_rekomendasi`, `title`, `status`, `created_by`, `approved_by_id`, `approved_by_name`, `approved_at`, `waktu_dibuat`, `days_menu`, `total_kalori`, `total_protein`, `total_karbohidrat`, `total_lemak`, `catatan_ahli_gizi`) VALUES
('menu-submitted-1', 'Menu Submitted - 2025-11-25', 'submitted', 'Dr. Ratna Dewi (ahli gizi)', 3, 'Dr. Ratna Dewi', '2025-11-25 16:41:00', '16.41', '{"Senin": ["food-dada-ayam", "food-nasi-putih", "food-brokoli", "food-wortel"], "Selasa": ["food-telur-rebus", "food-nasi-putih", "food-tempe-goreng"], "Rabu": ["food-ikan-salmon", "food-nasi-putih", "food-brokoli"], "Kamis": ["food-dada-ayam", "food-nasi-putih", "food-wortel"], "Jumat": ["food-telur-rebus", "food-nasi-putih", "food-pisang"]}', 435.0, 38.7, 60.0, 4.6, 'Menu makan siang seimbang dengan fokus pemulihan stunting.'),
('menu-draft-1', 'Menu Draft - 2025-11-25', 'draft', 'Dr. Ratna Dewi (ahli gizi)', NULL, NULL, NULL, '16.41', '{"Senin": ["food-nasi-putih", "food-tempe-goreng"], "Selasa": [], "Rabu": [], "Kamis": [], "Jumat": []}', 388.0, 23.0, 52.0, 11.4, 'Draf cadangan untuk peninjauan.');

-- --------------------------------------------------------
-- Table: laporan_menu (CL-15 LaporanController)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `laporan_menu`;
CREATE TABLE `laporan_menu` (
  `id_laporan` varchar(50) NOT NULL,
  `id_rekomendasi` varchar(50) DEFAULT NULL,
  `tanggal` date NOT NULL,
  `waktu` varchar(20) NOT NULL DEFAULT '16.41',
  `dibuat_oleh` varchar(255) NOT NULL DEFAULT 'Dr. Ratna Dewi',
  `peran` varchar(100) NOT NULL DEFAULT 'Ahli Gizi',
  `periode` varchar(255) NOT NULL,
  `total_porsi` int(11) NOT NULL DEFAULT 120,
  `status` enum('Disetujui','Diproses','Draft') NOT NULL DEFAULT 'Disetujui',
  `file_download` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_laporan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `laporan_menu` (`id_laporan`, `id_rekomendasi`, `tanggal`, `waktu`, `dibuat_oleh`, `peran`, `periode`, `total_porsi`, `status`, `file_download`) VALUES
('rep-1', 'menu-submitted-1', '2025-11-25', '16.41', 'Dr. Ratna Dewi', 'Ahli Gizi', 'Minggu ke-4 November 2025 (25 - 29 Nov 2025)', 120, 'Disetujui', 'Laporan_Menu_Minggu4_Nov2025.pdf'),
('rep-2', NULL, '2025-11-18', '15.30', 'Dr. Ratna Dewi', 'Ahli Gizi', 'Minggu ke-3 November 2025 (18 - 22 Nov 2025)', 120, 'Disetujui', 'Laporan_Menu_Minggu3_Nov2025.pdf'),
('rep-3', NULL, '2025-11-11', '14.15', 'Dr. Ratna Dewi', 'Ahli Gizi', 'Minggu ke-2 November 2025 (11 - 15 Nov 2025)', 120, 'Disetujui', 'Laporan_Menu_Minggu2_Nov2025.pdf');

-- --------------------------------------------------------
-- Table: audit_logs (FR-10 Audit Trail)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id_log` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_user` bigint(20) UNSIGNED DEFAULT NULL,
  `username` varchar(100) NOT NULL,
  `role` varchar(50) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_log`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `audit_logs` (`id_user`, `username`, `role`, `action`, `description`, `ip_address`) VALUES
(1, 'dimas_vikrian', 'Super Admin', 'SYSTEM_INIT', 'Inisialisasi sistem Smart Growth dan data awal berhasil', '127.0.0.1');

