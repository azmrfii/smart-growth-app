<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Pengujian fitur keamanan: login (FR-01), logout (FR-11), dan hak akses per role.
 *
 * Jalankan:  php artisan test
 * (memakai database SQLite sementara di memori, data MySQL tidak tersentuh)
 */
class KeamananApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    /** Login lalu kembalikan token. */
    private function login(string $username, string $password = 'password123'): string
    {
        $token = $this->postJson('/api/login', compact('username', 'password'))
            ->assertOk()
            ->json('data.token');

        // Laravel mengingat user selama satu test; reset agar token berikutnya benar-benar dicek.
        $this->app['auth']->forgetGuards();

        return $token;
    }

    // ---------- Login & Logout ----------

    public function test_login_benar_mendapat_token(): void
    {
        $this->postJson('/api/login', ['username' => 'siti_aminah', 'password' => 'password123'])
            ->assertOk()
            ->assertJsonPath('data.user.role', 'Tata Usaha')
            ->assertJsonStructure(['data' => ['token']]);
    }

    public function test_login_password_salah_ditolak(): void
    {
        $this->postJson('/api/login', ['username' => 'siti_aminah', 'password' => 'salah123'])
            ->assertStatus(401)
            ->assertJsonPath('success', false);
    }

    public function test_token_dipakai_untuk_mengenali_pengguna(): void
    {
        $token = $this->login('ratna_dewi');

        $this->withToken($token)->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('data.user.username', 'ratna_dewi');
    }

    public function test_setelah_logout_token_tidak_berlaku(): void
    {
        $token = $this->login('siti_aminah');

        $this->withToken($token)->postJson('/api/logout')->assertOk();
        $this->app['auth']->forgetGuards();

        $this->withToken($token)->getJson('/api/anak')->assertUnauthorized();
    }

    // ---------- Wajib login ----------

    public function test_tanpa_login_semua_data_ditolak(): void
    {
        $this->getJson('/api/anak')->assertUnauthorized();
        $this->getJson('/api/users')->assertUnauthorized();
        $this->deleteJson('/api/anak/1')->assertUnauthorized();
        $this->postJson('/api/users', [
            'name' => 'Penyusup', 'username' => 'hacker', 'password' => 'hacker123', 'role' => 'Super Admin',
        ])->assertUnauthorized();

        $this->assertDatabaseMissing('users', ['username' => 'hacker']);
        $this->assertDatabaseHas('anak', ['id_anak' => 1]);
    }

    // ---------- Hak akses per role ----------

    public function test_tata_usaha_tidak_boleh_kelola_pengguna(): void
    {
        $token = $this->login('siti_aminah');

        $this->withToken($token)->getJson('/api/users')->assertForbidden();
    }

    public function test_admin_dapur_boleh_lihat_anak_tapi_tidak_boleh_hapus(): void
    {
        $token = $this->login('budi_santoso');

        $this->withToken($token)->getJson('/api/anak')->assertOk();
        $this->withToken($token)->deleteJson('/api/anak/1')->assertForbidden();
        $this->assertDatabaseHas('anak', ['id_anak' => 1]);
    }

    public function test_ahli_gizi_boleh_rekomendasi_menu_tapi_tidak_boleh_tambah_anak(): void
    {
        $token = $this->login('ratna_dewi');

        $this->withToken($token)->getJson('/api/rekomendasi-menu')->assertOk();
        $this->withToken($token)->postJson('/api/anak', [])->assertForbidden();
    }

    public function test_tata_usaha_boleh_tambah_anak(): void
    {
        $token = $this->login('siti_aminah');

        $this->withToken($token)->postJson('/api/anak', [
            'name' => 'Anak Uji', 'classLabel' => 'TK A1', 'gender' => 'Perempuan',
            'ageDisplay' => '5th 0bln', 'heightCm' => 109, 'weightKg' => 18, 'alergi' => '-',
        ])->assertCreated();
    }

    // ---------- Kelola pengguna ----------

    public function test_pengguna_yang_dihapus_langsung_ter_logout(): void
    {
        $tokenUser = $this->login('budi_santoso');
        $tokenAdmin = $this->login('dimas_vikrian');
        $budi = User::where('username', 'budi_santoso')->first();

        $this->withToken($tokenAdmin)->deleteJson("/api/users/{$budi->id_user}")->assertOk();
        $this->app['auth']->forgetGuards();

        $this->withToken($tokenUser)->getJson('/api/anak')->assertUnauthorized();
        $this->postJson('/api/login', ['username' => 'budi_santoso', 'password' => 'password123'])
            ->assertForbidden();
    }

    public function test_super_admin_tidak_bisa_menghapus_dirinya_sendiri(): void
    {
        $token = $this->login('dimas_vikrian');
        $admin = User::where('username', 'dimas_vikrian')->first();

        $this->withToken($token)->deleteJson("/api/users/{$admin->id_user}")->assertStatus(422);
    }

    public function test_ganti_role_memaksa_login_ulang(): void
    {
        $tokenUser = $this->login('siti_aminah');
        $tokenAdmin = $this->login('dimas_vikrian');
        $siti = User::where('username', 'siti_aminah')->first();

        $this->withToken($tokenAdmin)->putJson("/api/users/{$siti->id_user}", ['role' => 'Ahli Gizi'])->assertOk();
        $this->app['auth']->forgetGuards();

        $this->withToken($tokenUser)->getJson('/api/anak')->assertUnauthorized();
    }
}
