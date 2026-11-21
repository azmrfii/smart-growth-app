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

## ✅ Validasi Data Masukan Form

Setiap form divalidasi **dua lapis**: di frontend (pesan langsung di bawah field) dan di backend Laravel (tidak bisa dilewati walau request dikirim manual). Aturan di kedua sisi sama.

| Form | Field | Aturan |
|---|---|---|
| Login | Username, Password | wajib; username tanpa spasi; panjang maks. 30 / 72 |
| Kelola Pengguna | Nama | wajib, 3-100 karakter, hanya huruf/spasi/titik/apostrof/tanda hubung |
| | Username | wajib, 5-30 karakter, huruf kecil/angka/`.`/`_`, tanpa spasi, unik |
| | Email | wajib, format `nama@domain.tld`, unik (tanpa beda huruf besar-kecil) |
| | Password | wajib saat tambah (boleh kosong saat edit), 8-72 karakter, ada huruf **dan** angka, tanpa spasi |
| | Role | harus salah satu dari 4 peran |
| Data Anak | Nama | wajib, 3-100 karakter, tanpa angka/simbol |
| | Kelas | wajib, 2-20 karakter, huruf/angka/spasi (contoh `TK A1`) |
| | Jenis kelamin, Status gizi | harus nilai dari daftar pilihan |
| | Usia | wajib, format `5th 8bln` / `5`; 3-7 tahun (cakupan standar WHO), bulan 0-11 |
| | TB / BB | wajib, angka; TB 60-160 cm, BB 5-80 kg |
| | Alergi | wajib (`-` jika tidak ada), maks. 200 karakter, tanpa simbol berbahaya |
| Tambah Bahan | Nama | wajib, 2-50 karakter, diawali huruf, tidak boleh duplikat |
| | Kalori / Protein / Karbo / Lemak | wajib, angka ≥ 0; kalori ≤ 2000, makro ≤ 500 g |

Kode: `app/lib/validation.ts` (frontend) dan `rules`/`validate()` di tiap controller `smart-growth-api/app/Http/Controllers/Api`.

## ✉️ Aktivasi Akun via Email & OTP (opsional)

1. Super Admin menambah pengguna **beserta email** → status akun `Menunggu Aktivasi`, sistem mengirim **kode OTP 6 digit** ke email tersebut.
2. Pengguna membuka halaman login → **"Aktivasi dengan kode OTP"** (atau otomatis muncul saat mencoba login) → isi email + OTP.
3. Akun menjadi `Aktif` dan bisa login.

Keamanan OTP: dibuat dengan `random_int` (CSPRNG), hanya **hash**-nya yang disimpan, berlaku **10 menit**, **sekali pakai**, maksimal **5 kali salah** lalu terkunci, kirim ulang berjeda **60 detik**, endpoint dibatasi throttle, dan respons tidak membocorkan email mana yang terdaftar.

Saat pengembangan `MAIL_MAILER=log`, jadi email OTP tidak benar-benar terkirim — isinya tertulis di `smart-growth-api/storage/logs/laravel.log`. Untuk mengirim email sungguhan, isi konfigurasi SMTP (`MAIL_MAILER=smtp`, `MAIL_HOST`, dst.) di `.env`.

> Skema tabel `users` bertambah kolom `email`, `email_verified_at`, `otp_*` dan status `Menunggu Aktivasi`. Jalankan ulang `php artisan migrate:fresh --seed` atau import ulang `database/smart_growth.sql`.

### Menjalankan Pengujian
```bash
pnpm exec vitest --run                  # unit test validasi frontend
cd smart-growth-api && php artisan test # tes keamanan + validasi + OTP backend
```

---
*© 2025 Sistem Manajemen Gizi Anak - Platform Monitoring Gizi Berbasis WHO Z-Score*
