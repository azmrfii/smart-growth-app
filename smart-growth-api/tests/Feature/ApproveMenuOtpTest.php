<?php

namespace Tests\Feature;

use App\Mail\ActivationOtpMail;
use App\Mail\MenuApprovalOtpMail;
use App\Models\AuditLog;
use App\Models\RekomendasiMenu;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Approve menu wajib dikonfirmasi OTP email: berlaku 5 menit, maksimal 3 kali salah,
 * dan setiap approve tercatat di audit_logs.
 */
class ApproveMenuOtpTest extends TestCase
{
    use RefreshDatabase;

    private string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);

        RekomendasiMenu::create([
            'id_rekomendasi' => 'menu-uji',
            'title' => 'Menu Uji',
            'status' => 'draft',
            'created_by' => 'Dr. Ratna Dewi',
            'waktu_dibuat' => '10.00',
            'days_menu' => ['Senin' => ['food-nasi-putih']],
        ]);
        RekomendasiMenu::create([
            'id_rekomendasi' => 'menu-lain',
            'title' => 'Menu Lain',
            'status' => 'draft',
            'created_by' => 'Dr. Ratna Dewi',
            'waktu_dibuat' => '10.00',
            'days_menu' => ['Senin' => ['food-pisang']],
        ]);

        $this->token = $this->postJson('/api/login', ['username' => 'ratna_dewi', 'password' => 'password123'])
            ->assertOk()->json('data.token');
        $this->app['auth']->forgetGuards();
    }

    /** Minta OTP untuk $menuId lalu kembalikan kodenya dari email. */
    private function mintaOtp(string $menuId = 'menu-uji'): string
    {
        Mail::fake();
        $this->withToken($this->token)->postJson("/api/rekomendasi-menu/{$menuId}/approve/request-otp")->assertOk();

        $otp = null;
        Mail::assertSent(MenuApprovalOtpMail::class, function ($m) use (&$otp) {
            $otp = $m->otp;

            return $m->hasTo('ratna@smartgrowth.id');
        });

        return $otp;
    }

    private function approve(string $otp, string $menuId = 'menu-uji')
    {
        return $this->withToken($this->token)->postJson("/api/rekomendasi-menu/{$menuId}/approve", ['otp' => $otp]);
    }

    private function salah(string $otp): string
    {
        return $otp === '000000' ? '111111' : '000000';
    }

    public function test_minta_otp_mengirim_email_ke_penyetuju_berlaku_5_menit(): void
    {
        Mail::fake();
        $this->withToken($this->token)->postJson('/api/rekomendasi-menu/menu-uji/approve/request-otp')
            ->assertOk()
            ->assertJsonPath('expiresIn', 300)
            ->assertJsonPath('maxAttempts', 3)
            ->assertJsonPath('email', 'r****@smartgrowth.id');

        Mail::assertSent(MenuApprovalOtpMail::class, fn ($m) => $m->hasTo('ratna@smartgrowth.id') && $m->validMinutes === 5);

        $user = User::where('username', 'ratna_dewi')->first();
        $this->assertSame('approve_menu:menu-uji', $user->otp_purpose);
        $this->assertEqualsWithDelta(300, now()->diffInSeconds($user->otp_expires_at), 2);
    }

    public function test_approve_tanpa_otp_ditolak(): void
    {
        $this->withToken($this->token)->postJson('/api/rekomendasi-menu/menu-uji/approve')
            ->assertStatus(422)->assertJsonValidationErrors(['otp']);
        $this->assertSame('draft', RekomendasiMenu::find('menu-uji')->status);
    }

    public function test_approve_sebelum_minta_otp_ditolak(): void
    {
        $this->approve('123456')->assertStatus(422)->assertJsonPath('code', 'NONE');
    }

    public function test_otp_benar_menyetujui_menu_dan_tercatat_di_audit_log(): void
    {
        $otp = $this->mintaOtp();

        $this->approve($otp)->assertOk()->assertJsonPath('data.status', 'submitted');

        $menu = RekomendasiMenu::find('menu-uji');
        $this->assertSame('submitted', $menu->status);
        $this->assertSame('Dr. Ratna Dewi', $menu->approved_by_name);
        $this->assertDatabaseHas('laporan_menu', ['id_rekomendasi' => 'menu-uji']);

        $log = AuditLog::where('action', 'APPROVE_MENU')->latest('id_log')->first();
        $this->assertNotNull($log);
        $this->assertSame('ratna_dewi', $log->username);
        $this->assertStringContainsString('menu-uji', $log->description);
        $this->assertDatabaseHas('audit_logs', ['action' => 'MINTA_OTP_APPROVE_MENU', 'username' => 'ratna_dewi']);

        // sekali pakai & menu sudah tidak draft
        $this->approve($otp)->assertStatus(422);
    }

    public function test_salah_tiga_kali_mengunci_otp(): void
    {
        $otp = $this->mintaOtp();

        $this->approve($this->salah($otp))->assertStatus(422)->assertJsonPath('message', 'Kode OTP salah. Sisa percobaan: 2.');
        $this->approve($this->salah($otp))->assertStatus(422)->assertJsonPath('message', 'Kode OTP salah. Sisa percobaan: 1.');
        $this->approve($this->salah($otp))->assertStatus(429)->assertJsonPath('code', 'LOCKED');

        // kode yang benar pun tidak lagi diterima
        $this->approve($otp)->assertStatus(429);
        $this->assertSame('draft', RekomendasiMenu::find('menu-uji')->status);
        $this->assertDatabaseHas('audit_logs', ['action' => 'APPROVE_MENU_DIBLOKIR', 'username' => 'ratna_dewi']);
    }

    public function test_otp_kedaluwarsa_setelah_5_menit(): void
    {
        $otp = $this->mintaOtp();
        $this->travel(5)->minutes();
        $this->travel(1)->seconds();

        $this->approve($otp)->assertStatus(422)->assertJsonPath('code', 'EXPIRED');
        $this->assertSame('draft', RekomendasiMenu::find('menu-uji')->status);
    }

    public function test_minta_kode_baru_setelah_terkunci_bisa_approve(): void
    {
        $lama = $this->mintaOtp();
        for ($i = 0; $i < 3; $i++) {
            $this->approve($this->salah($lama));
        }

        $this->travel(61)->seconds();
        $baru = $this->mintaOtp();
        $this->approve($baru)->assertOk();
    }

    public function test_minta_ulang_dibatasi_60_detik(): void
    {
        $this->mintaOtp();
        $this->withToken($this->token)->postJson('/api/rekomendasi-menu/menu-uji/approve/request-otp')
            ->assertStatus(429)->assertJsonStructure(['retryAfter']);
    }

    public function test_otp_menu_lain_tidak_berlaku(): void
    {
        $otp = $this->mintaOtp('menu-lain');

        $this->approve($otp, 'menu-uji')->assertStatus(422)->assertJsonPath('code', 'NONE');
        $this->assertSame('draft', RekomendasiMenu::find('menu-uji')->status);
    }

    public function test_otp_aktivasi_tidak_bisa_dipakai_untuk_approve(): void
    {
        $user = User::where('username', 'ratna_dewi')->first();
        Mail::fake();
        app(\App\Services\OtpService::class)->issueActivation($user);
        $otp = null;
        Mail::assertSent(ActivationOtpMail::class, function ($m) use (&$otp) {
            $otp = $m->otp;

            return true;
        });

        $this->approve($otp)->assertStatus(422)->assertJsonPath('code', 'NONE');
    }

    public function test_menu_yang_sudah_disetujui_tidak_bisa_minta_otp(): void
    {
        RekomendasiMenu::find('menu-uji')->update(['status' => 'submitted']);
        $this->withToken($this->token)->postJson('/api/rekomendasi-menu/menu-uji/approve/request-otp')->assertStatus(422);
    }

    public function test_role_lain_tidak_bisa_minta_otp_approve(): void
    {
        $token = $this->postJson('/api/login', ['username' => 'budi_santoso', 'password' => 'password123'])->json('data.token');
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->postJson('/api/rekomendasi-menu/menu-uji/approve/request-otp')->assertStatus(403);
    }
}
