<?php

namespace Tests\Feature;

use App\Mail\ActivationOtpMail;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Pengujian validasi data masukan form (wajib) serta aktivasi akun via OTP email (opsional).
 */
class ValidasiDanOtpTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    private function tokenFor(string $username): string
    {
        $token = $this->postJson('/api/login', ['username' => $username, 'password' => 'password123'])
            ->assertOk()->json('data.token');
        $this->app['auth']->forgetGuards();

        return $token;
    }

    private function validUser(array $override = []): array
    {
        return array_merge([
            'name' => 'Andi Wijaya',
            'username' => 'andi_w',
            'email' => 'andi@example.com',
            'password' => 'Rahasia123',
            'role' => 'Tata Usaha',
        ], $override);
    }

    private function validKid(array $override = []): array
    {
        return array_merge([
            'name' => 'Ahmad Ridwan',
            'classLabel' => 'TK A1',
            'gender' => 'Laki-laki',
            'ageDisplay' => '5th 8bln',
            'heightCm' => 105,
            'weightKg' => 17,
            'alergi' => 'Telur, Kacang',
        ], $override);
    }

    // ---------------- Login ----------------

    public function test_login_tanpa_field_wajib_ditolak(): void
    {
        $this->postJson('/api/login', [])->assertStatus(422)->assertJsonValidationErrors(['username', 'password']);
    }

    // ---------------- Pengguna ----------------

    /** @dataProvider penggunaTidakValid */
    public function test_tambah_pengguna_tidak_valid_ditolak(array $override, string $field): void
    {
        $token = $this->tokenFor('dimas_vikrian');
        $this->withToken($token)->postJson('/api/users', $this->validUser($override))
            ->assertStatus(422)->assertJsonValidationErrors([$field]);
    }

    public static function penggunaTidakValid(): array
    {
        return [
            'nama kosong' => [['name' => ''], 'name'],
            'nama berisi angka' => [['name' => 'Andi123'], 'name'],
            'nama terlalu pendek' => [['name' => 'Al'], 'name'],
            'username ada spasi' => [['username' => 'andi w'], 'username'],
            'username terlalu pendek' => [['username' => 'andi'], 'username'],
            'username huruf besar' => [['username' => 'Andi_W'], 'username'],
            'username sudah dipakai' => [['username' => 'siti_aminah'], 'username'],
            'email kosong' => [['email' => ''], 'email'],
            'email tanpa @' => [['email' => 'andiexample.com'], 'email'],
            'email tanpa domain' => [['email' => 'andi@'], 'email'],
            'email sudah dipakai' => [['email' => 'siti@smartgrowth.id'], 'email'],
            'password pendek' => [['password' => 'abc123'], 'password'],
            'password tanpa angka' => [['password' => 'rahasiasaja'], 'password'],
            'password tanpa huruf' => [['password' => '12345678'], 'password'],
            'role tidak dikenal' => [['role' => 'Hacker'], 'role'],
        ];
    }

    public function test_tambah_pengguna_valid_menunggu_aktivasi_dan_kirim_otp(): void
    {
        Mail::fake();
        $token = $this->tokenFor('dimas_vikrian');

        $this->withToken($token)->postJson('/api/users', $this->validUser())
            ->assertCreated()
            ->assertJsonPath('requiresActivation', true)
            ->assertJsonPath('data.status', 'Menunggu Aktivasi');

        Mail::assertSent(ActivationOtpMail::class, fn ($m) => $m->hasTo('andi@example.com') && preg_match('/^\d{6}$/', $m->otp));
        $this->assertNotNull(User::where('username', 'andi_w')->value('otp_hash'));
    }

    public function test_email_gagal_terkirim_membatalkan_pembuatan_akun(): void
    {
        Mail::shouldReceive('to')->andThrow(new \RuntimeException('SMTP down'));
        $token = $this->tokenFor('dimas_vikrian');

        $this->withToken($token)->postJson('/api/users', $this->validUser())->assertStatus(502);
        $this->assertDatabaseMissing('users', ['username' => 'andi_w']);
    }

    // ---------------- Aktivasi OTP ----------------

    private function buatAkunBaru(): string
    {
        $otp = null;
        Mail::fake();
        $token = $this->tokenFor('dimas_vikrian');
        $this->withToken($token)->postJson('/api/users', $this->validUser())->assertCreated();
        Mail::assertSent(ActivationOtpMail::class, function ($m) use (&$otp) {
            $otp = $m->otp;

            return true;
        });
        $this->app['auth']->forgetGuards();

        return $otp;
    }

    public function test_login_sebelum_aktivasi_ditolak(): void
    {
        $this->buatAkunBaru();
        $this->postJson('/api/login', ['username' => 'andi_w', 'password' => 'Rahasia123'])
            ->assertStatus(403)->assertJsonPath('code', 'ACCOUNT_NOT_ACTIVATED');
    }

    public function test_otp_benar_mengaktifkan_akun_dan_hanya_sekali_pakai(): void
    {
        $otp = $this->buatAkunBaru();

        $this->postJson('/api/activate', ['email' => 'ANDI@example.com', 'otp' => $otp])->assertOk();
        $this->postJson('/api/login', ['username' => 'andi_w', 'password' => 'Rahasia123'])->assertOk();

        // sudah aktif -> OTP yang sama tidak bisa dipakai lagi
        $this->postJson('/api/activate', ['email' => 'andi@example.com', 'otp' => $otp])->assertStatus(422);
    }

    public function test_format_otp_salah_ditolak(): void
    {
        $this->buatAkunBaru();
        foreach (['', '12345', '1234567', 'abcdef', '12 456'] as $bad) {
            $this->postJson('/api/activate', ['email' => 'andi@example.com', 'otp' => $bad])
                ->assertStatus(422)->assertJsonValidationErrors(['otp']);
        }
    }

    public function test_otp_salah_dibatasi_lima_kali(): void
    {
        $otp = $this->buatAkunBaru();
        $salah = $otp === '000000' ? '111111' : '000000';

        for ($i = 0; $i < 4; $i++) {
            $this->postJson('/api/activate', ['email' => 'andi@example.com', 'otp' => $salah])->assertStatus(422);
        }
        // percobaan ke-5 mengunci; OTP yang benar pun tidak lagi diterima
        $this->postJson('/api/activate', ['email' => 'andi@example.com', 'otp' => $salah])->assertStatus(429);
        $this->postJson('/api/activate', ['email' => 'andi@example.com', 'otp' => $otp])->assertStatus(429);
    }

    public function test_otp_kedaluwarsa_ditolak(): void
    {
        $otp = $this->buatAkunBaru();
        User::where('username', 'andi_w')->update(['otp_expires_at' => now()->subMinute()]);

        $this->postJson('/api/activate', ['email' => 'andi@example.com', 'otp' => $otp])->assertStatus(422);
        $this->assertSame('Menunggu Aktivasi', User::where('username', 'andi_w')->value('status'));
    }

    public function test_kirim_ulang_otp_dibatasi_jeda_60_detik(): void
    {
        $this->buatAkunBaru();
        Mail::fake();

        // baru saja dikirim -> tidak ada email baru, tetapi respons tetap generik
        $this->postJson('/api/activate/resend', ['email' => 'andi@example.com'])->assertOk();
        Mail::assertNothingSent();

        User::where('username', 'andi_w')->update(['otp_sent_at' => now()->subSeconds(61)]);
        $this->postJson('/api/activate/resend', ['email' => 'andi@example.com'])->assertOk();
        Mail::assertSent(ActivationOtpMail::class, 1);
    }

    public function test_resend_email_tak_dikenal_tidak_membocorkan_data(): void
    {
        Mail::fake();
        $this->postJson('/api/activate/resend', ['email' => 'tidakada@example.com'])->assertOk();
        Mail::assertNothingSent();
    }

    // ---------------- Data Anak ----------------

    public function test_tambah_anak_valid(): void
    {
        $token = $this->tokenFor('siti_aminah');
        $this->withToken($token)->postJson('/api/anak', $this->validKid())
            ->assertCreated()->assertJsonPath('data.ageYears', 5);
    }

    /** @dataProvider anakTidakValid */
    public function test_tambah_anak_tidak_valid_ditolak(array $override, string $field): void
    {
        $token = $this->tokenFor('siti_aminah');
        $this->withToken($token)->postJson('/api/anak', $this->validKid($override))
            ->assertStatus(422)->assertJsonValidationErrors([$field]);
    }

    public static function anakTidakValid(): array
    {
        return [
            'nama kosong' => [['name' => ''], 'name'],
            'nama berisi angka' => [['name' => 'Ahmad99'], 'name'],
            'kelas simbol' => [['classLabel' => 'TK<A1>'], 'classLabel'],
            'gender asal' => [['gender' => 'Lainnya'], 'gender'],
            'usia format salah' => [['ageDisplay' => 'lima tahun'], 'ageDisplay'],
            'usia di luar cakupan' => [['ageDisplay' => '12th 0bln'], 'ageDisplay'],
            'bulan lebih dari 11' => [['ageDisplay' => '5th 14bln'], 'ageDisplay'],
            'TB negatif' => [['heightCm' => -5], 'heightCm'],
            'TB tidak masuk akal' => [['heightCm' => 999], 'heightCm'],
            'TB bukan angka' => [['heightCm' => 'abc'], 'heightCm'],
            'BB nol' => [['weightKg' => 0], 'weightKg'],
            'BB terlalu besar' => [['weightKg' => 500], 'weightKg'],
            'alergi kosong' => [['alergi' => ''], 'alergi'],
            'alergi simbol' => [['alergi' => '<script>'], 'alergi'],
        ];
    }

    public function test_usia_bulan_tersimpan_dari_teks_usia(): void
    {
        $token = $this->tokenFor('siti_aminah');
        $this->withToken($token)->postJson('/api/anak', $this->validKid(['ageDisplay' => '4th 3bln']))->assertCreated();
        $this->assertDatabaseHas('anak', ['nama' => 'Ahmad Ridwan', 'usia_bulan' => 51]);
    }

    // ---------------- Bahan menu ----------------

    public function test_tambah_bahan_valid_dan_duplikat(): void
    {
        $token = $this->tokenFor('ratna_dewi');
        $food = ['name' => 'Tahu Kukus', 'calories' => 80, 'protein' => 8, 'carbs' => 2, 'fat' => 4.5];

        $this->withToken($token)->postJson('/api/foods', $food)->assertCreated();
        $this->withToken($token)->postJson('/api/foods', $food)->assertStatus(422)->assertJsonValidationErrors(['name']);
    }

    /** @dataProvider bahanTidakValid */
    public function test_tambah_bahan_tidak_valid_ditolak(array $override, string $field): void
    {
        $token = $this->tokenFor('ratna_dewi');
        $food = array_merge(['name' => 'Tahu Kukus', 'calories' => 80, 'protein' => 8, 'carbs' => 2, 'fat' => 4.5], $override);
        $this->withToken($token)->postJson('/api/foods', $food)->assertStatus(422)->assertJsonValidationErrors([$field]);
    }

    public static function bahanTidakValid(): array
    {
        return [
            'nama kosong' => [['name' => ''], 'name'],
            'nama diawali angka' => [['name' => '1Tahu'], 'name'],
            'kalori negatif' => [['calories' => -1], 'calories'],
            'kalori bukan angka' => [['calories' => 'banyak'], 'calories'],
            'kalori kosong' => [['calories' => ''], 'calories'],
            'protein terlalu besar' => [['protein' => 9999], 'protein'],
            'lemak negatif' => [['fat' => -0.1], 'fat'],
        ];
    }
}
