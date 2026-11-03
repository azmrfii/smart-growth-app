# Smart Growth Backend API (Laravel & MySQL)
**Sistem Deteksi dan Rekomendasi Menu Gizi Anak**
*Berdasarkan Dokumen SKPL-0425 dan DPPL-0425 (Program Studi S1 Informatika - Universitas Telkom)*

---

## 📌 Ringkasan Proyek
Project ini adalah backend RESTful API terpisah berbasis **Laravel** dan **MySQL** yang dirancang untuk melayani Frontend React Smart Growth. API ini mencakup:
1. **Autentikasi & RBAC (Role-Based Access Control)**: Mendukung 4 role utama dengan menu sidebar dan hak akses yang disesuaikan secara otomatis.
2. **Kelola Pengguna (FR-10)**: Modul Super Admin untuk CRUD akun dan hak akses.
3. **Manajemen Data Anak (FR-02)**: Modul Tata Usaha untuk CRUD antropometri anak (usia, TB, BB, alergi).
4. **Standar Gizi WHO (FR-03)**: Referensi tabel Z-Score TB/U anak usia 3-7 tahun.
5. **Analisis Status Gizi Otomatis (FR-04)**: Klasifikasi otomatis status gizi berdasarkan formula Z-Score WHO:
   $$\text{Z-Score} = \frac{\text{Nilai Pengukuran} - \text{Median Referensi}}{\text{Standar Deviasi (SD)}}$$
   - $Z < -3 \text{ SD}$: Gizi Buruk
   - $-3 \text{ SD} \le Z < -2 \text{ SD}$: Gizi Kurang
   - $-2 \text{ SD} \le Z \le +2 \text{ SD}$: Gizi Baik
   - $+2 \text{ SD} < Z \le +3 \text{ SD}$: Gizi Lebih
   - $Z > +3 \text{ SD}$: Obesitas
6. **Rekomendasi Menu (FR-05, FR-06)**: Modul Ahli Gizi untuk generate menu otomatis, penambahan bahan manual, simpan draf, dan persetujuan (approve).
7. **Laporan Final Menu (FR-07, FR-08, FR-09)**: Modul Admin Dapur MBG untuk melihat jadwal menu mingguan dan unduh dokumen laporan resmi.
8. **Audit Trail Log**: Pencatatan aktivitas sistem untuk keamanan dan pemantauan.

---

## 🗄️ Konfigurasi Database (MySQL)

### 1. Buat Database di MySQL / phpMyAdmin:
Buka XAMPP Control Panel, jalankan **Apache** dan **MySQL**, lalu buat database:
```sql
CREATE DATABASE smart_growth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Cara Import Cepat (1-Click SQL):
Tersedia file SQL lengkap dengan seluruh tabel dan seed data awal:
```bash
mysql -u root smart_growth < database/smart_growth.sql
```
*Atau buka `http://localhost/phpmyadmin`, pilih database `smart_growth`, lalu import file `database/smart_growth.sql`.*

### 3. Konfigurasi `.env`:
Pastikan pengaturan di file `.env`:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=smart_growth
DB_USERNAME=root
DB_PASSWORD=
```

---

## 🚀 Cara Menjalankan API Server

### Opsi A (Menggunakan Standalone Server - Tanpa Composer Install):
Jika Composer atau OpenSSL CA di PHP lokal Anda belum tersetting, Anda bisa langsung menjalankan server API menggunakan router standalone bawaan yang langsung terhubung ke MySQL:
```bash
php -S 127.0.0.1:8000 standalone_api_server.php
```

### Opsi B (Standar Laravel):
```bash
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

---

## 👥 Akun Default Berdasarkan 4 Role (Sesuai Frontend)

| Role | Username | Password | Default Page | Hak Akses Navigasi Sidebar |
|---|---|---|---|---|
| **Super Admin** | `dimas_vikrian` | `password123` | `/kelola-pengguna` | Kelola Pengguna |
| **Tata Usaha** | `siti_aminah` | `password123` | `/data-anak` | Data Anak |
| **Ahli Gizi** | `ratna_dewi` | `password123` | `/rekomendasi-menu` | Standar Gizi, Status Gizi, Rekomendasi Menu |
| **Admin dapur MBG** | `budi_santoso` | `password123` | `/laporan-menu` | Laporan Menu, Status Gizi |

---

## 📡 Daftar Endpoint API

### 1. Autentikasi & Sidebar Berdasarkan Role
- **`POST /api/login`**
  - **Body**: `{"username": "dimas_vikrian", "password": "password123"}`
  - **Response**: Mengembalikan token, profil pengguna, role, dan array `sidebarMenus` yang memfilter menu sesuai perannya.
- **`POST /api/logout`**
  - Mengakhiri sesi aktif pengguna.
- **`GET /api/sidebar?role={roleName}`**
  - Mengambil daftar item navigasi sidebar yang diizinkan untuk role terkait.

### 2. Kelola Pengguna (Super Admin - FR-10)
- `GET /api/users` (Daftar semua pengguna dan summary)
- `POST /api/users` (Tambah pengguna baru)
- `PUT /api/users/{id}` (Perbarui profil / peran pengguna)
- `DELETE /api/users/{id}` (Nonaktifkan pengguna)

### 3. Kelola Data Anak (Tata Usaha - FR-02)
- `GET /api/anak` (Daftar 30 anak, filter kelas / pencarian)
- `GET /api/anak/{id}` (Detail anak + riwayat pengukuran gizi)
- `POST /api/anak` (Tambah data anak + otomatis hitung Z-Score WHO)
- `PUT /api/anak/{id}` (Edit data fisik anak + kalkulasi ulang Z-Score)
- `DELETE /api/anak/{id}` (Hapus data anak)

### 4. Standar Gizi (Ahli Gizi - FR-03)
- `GET /api/standard-gizi` (Tabel referensi WHO Anthro usia 3-7 tahun)
- `PUT /api/standard-gizi/{id}` (Perbarui threshold nilai batas)

### 5. Status Gizi (Ahli Gizi & Admin Dapur - FR-04)
- `GET /api/status-gizi` (Distribusi persentase gizi: Gizi Buruk, Gizi Kurang, Gizi Baik, Gizi Lebih, Obesitas)
- `GET /api/status-gizi/anak/{id}` (Kalkulasi rinci BMI & Z-Score TB/U per anak)

### 6. Rekomendasi Menu (Ahli Gizi - FR-05, FR-06)
- `GET /api/foods` (Daftar bahan makanan: Dada Ayam, Nasi Putih, Brokoli, dll)
- `POST /api/foods` (Tambah bahan makanan baru)
- `GET /api/rekomendasi-menu` (Daftar menu draft dan disetujui)
- `POST /api/rekomendasi-menu/generate` (Generate otomatis rekomendasi menu mingguan)
- `POST /api/rekomendasi-menu/draft` (Simpan draf menu builder)
- `POST /api/rekomendasi-menu/{id}/approve` (Persetujuan final menu untuk Dapur MBG)
- `DELETE /api/rekomendasi-menu/{id}` (Hapus draft menu)

### 7. Laporan Final Menu (Admin Dapur MBG - FR-07, FR-08, FR-09)
- `GET /api/laporan-menu` (Daftar riwayat laporan final & jadwal masak harian)
- `GET /api/laporan-menu/{id}/pdf` (Cetak / Unduh dokumen format laporan PDF resmi)

