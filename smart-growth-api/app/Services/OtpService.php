<?php

namespace App\Services;

use App\Mail\ActivationOtpMail;
use App\Mail\MenuApprovalOtpMail;
use App\Models\RekomendasiMenu;
use App\Models\User;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

/**
 * Pembuatan & verifikasi OTP untuk beberapa tujuan (purpose).
 *
 * Aturan keamanan umum:
 *  - kode 6 digit dari CSPRNG (random_int), hanya hash-nya yang disimpan;
 *  - sekali pakai dan berbatas waktu;
 *  - jumlah percobaan salah dibatasi, setelah itu kode harus diminta ulang;
 *  - kode terikat pada tujuannya (otp_purpose): kode aktivasi tidak bisa dipakai
 *    untuk approve menu, dan kode approve menu A tidak berlaku untuk menu B;
 *  - kirim ulang untuk tujuan yang sama dibatasi jeda 60 detik.
 *
 * Tujuan yang tersedia:
 *  - Aktivasi akun      : berlaku 10 menit, maks. 5 kali salah.
 *  - Approve menu {id}  : berlaku 5 menit,  maks. 3 kali salah.
 */
class OtpService
{
    public const ACTIVATION_MINUTES = 10;
    public const ACTIVATION_MAX_ATTEMPTS = 5;

    public const APPROVAL_MINUTES = 5;
    public const APPROVAL_MAX_ATTEMPTS = 3;

    public const RESEND_SECONDS = 60;

    public const OK = 'ok';
    public const INVALID = 'invalid';
    public const EXPIRED = 'expired';
    public const LOCKED = 'locked';
    public const NONE = 'none';

    // ------------------------------------------------------------ tujuan

    public static function activationPurpose(): string
    {
        return 'activation';
    }

    public static function menuApprovalPurpose(RekomendasiMenu|string $menu): string
    {
        $id = $menu instanceof RekomendasiMenu ? $menu->id_rekomendasi : $menu;

        return "approve_menu:{$id}";
    }

    /** Kirim OTP aktivasi akun. */
    public function issueActivation(User $user): void
    {
        $this->issue(
            $user,
            self::activationPurpose(),
            self::ACTIVATION_MINUTES,
            fn (string $otp) => new ActivationOtpMail($user->name, $otp, self::ACTIVATION_MINUTES),
        );
    }

    /** Verifikasi OTP aktivasi. Bila cocok, akun diaktifkan. */
    public function verifyActivation(User $user, string $code): string
    {
        $result = $this->verify($user, $code, self::activationPurpose(), self::ACTIVATION_MAX_ATTEMPTS);

        if ($result === self::OK) {
            $user->forceFill(['status' => 'Aktif', 'email_verified_at' => now()])->save();
        }

        return $result;
    }

    /** Kirim OTP konfirmasi approve menu ke email penyetuju. */
    public function issueMenuApproval(User $user, RekomendasiMenu $menu): void
    {
        $this->issue(
            $user,
            self::menuApprovalPurpose($menu),
            self::APPROVAL_MINUTES,
            fn (string $otp) => new MenuApprovalOtpMail($user->name, $menu->title, $otp, self::APPROVAL_MINUTES),
        );
    }

    public function verifyMenuApproval(User $user, RekomendasiMenu $menu, string $code): string
    {
        return $this->verify($user, $code, self::menuApprovalPurpose($menu), self::APPROVAL_MAX_ATTEMPTS);
    }

    // ------------------------------------------------------- logika umum

    /**
     * Buat OTP baru untuk $purpose dan kirim lewat email.
     * OTP lama (tujuan apa pun) otomatis tidak berlaku lagi.
     *
     * @param  callable(string): Mailable  $makeMail
     */
    public function issue(User $user, string $purpose, int $validMinutes, callable $makeMail): void
    {
        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $user->forceFill([
            'otp_hash' => Hash::make($otp),
            'otp_purpose' => $purpose,
            'otp_expires_at' => now()->addMinutes($validMinutes),
            'otp_attempts' => 0,
            'otp_sent_at' => now(),
        ])->save();

        Mail::to($user->email)->send($makeMail($otp));
    }

    /**
     * Berapa detik lagi sebelum OTP untuk $purpose boleh dikirim ulang (0 = boleh sekarang).
     * Tanpa $purpose: dihitung dari OTP terakhir apa pun.
     */
    public function resendWaitSeconds(User $user, ?string $purpose = null): int
    {
        if (!$user->otp_sent_at || ($purpose !== null && $user->otp_purpose !== $purpose)) {
            return 0;
        }
        $elapsed = $user->otp_sent_at->diffInSeconds(now(), true);

        return max(0, (int) ceil(self::RESEND_SECONDS - $elapsed));
    }

    /** Sisa percobaan untuk OTP yang sedang aktif. */
    public function attemptsLeft(User $user, int $maxAttempts): int
    {
        return max(0, $maxAttempts - (int) $user->otp_attempts);
    }

    /** Cek kode untuk $purpose. Bila cocok, OTP dihapus (sekali pakai). */
    public function verify(User $user, string $code, string $purpose, int $maxAttempts): string
    {
        if (!$user->otp_hash || !$user->otp_expires_at || $user->otp_purpose !== $purpose) {
            return self::NONE;
        }
        if ($user->otp_attempts >= $maxAttempts) {
            return self::LOCKED;
        }
        if ($user->otp_expires_at->isPast()) {
            return self::EXPIRED;
        }
        if (!Hash::check($code, $user->otp_hash)) {
            $user->forceFill(['otp_attempts' => $user->otp_attempts + 1])->save();

            return ($user->otp_attempts >= $maxAttempts) ? self::LOCKED : self::INVALID;
        }

        $user->forceFill([
            'otp_hash' => null,
            'otp_purpose' => null,
            'otp_expires_at' => null,
            'otp_attempts' => 0,
        ])->save();

        return self::OK;
    }
}
