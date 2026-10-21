# Smart Growth - Sistem Manajemen Gizi Anak

Platform profesional untuk monitoring dan analisis status gizi anak berbasis standar WHO Z-Score, pengelolaan data anak & alergi, rekomendasi menu gizi seimbang, dan laporan dapur MBG.

## 🚀 Fitur Utama & Role Pengguna

Sistem ini dirancang dengan kontrol akses berbasis peran (*Role-Based Access Control*):

1. **Super Admin** (`@dimas_vikrian`):
   - Kelola pengguna & hak akses akun
   - Monitoring peran & status aktif pengguna
2. **Tata Usaha** (`@siti_aminah`):
   - Kelola Data Anak (Nama, Kelas, Usia, TB, BB, Status Gizi WHO, dan Riwayat Alergi Makanan)
   - Form Tambah / Edit / Hapus anak dengan *quick-select allergen chips*
3. **Admin Dapur MBG** (`@budi_santoso`):
   - Laporan Final Menu mingguan
   - Catatan porsi & alergi per jadwal distribusi menu
4. **Ahli Gizi** (`@ratna_dewi`):
   - Perencanaan & Rekomendasi Menu Gizi Seimbang
   - Analisis & Standar Gizi anak

## 🛠️ Menjalankan Proyek Secara Lokal

### Prasyarat
- Node.js >= 20
- pnpm >= 9

### Langkah Instalasi
```bash
# 1. Salin konfigurasi environment
cp .env.example .env

# Pastikan AUTH_DISABLED=true pada .env untuk mode dev lokal

# 2. Instal dependensi
pnpm install

# 3. Jalankan server development
pnpm dev
```

Buka peramban di [http://localhost:8080](http://localhost:8080) untuk mengakses aplikasi.

## 👥 Akun Demo untuk Pengujian

| Peran | Username | Password | Halaman Default |
|---|---|---|---|
| Super Admin | `dimas_vikrian` | `password123` | `/kelola-pengguna` |
| Tata Usaha | `siti_aminah` | `password123` | `/data-anak` |
| Admin Dapur MBG | `budi_santoso` | `password123` | `/laporan-menu` |
| Ahli Gizi | `ratna_dewi` | `password123` | `/rekomendasi-menu` |

---
*© 2025 Sistem Manajemen Gizi Anak - Platform Monitoring Gizi Berbasis WHO Z-Score*
