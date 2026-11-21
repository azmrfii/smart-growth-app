<?php

namespace App\Services;

use App\Mail\ActivationOtpMail;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

/**
 * Pembuatan & verifikasi OTP aktivasi akun.
 *
 * Aturan keamanan:
 *  - kode 6 digit dari CSPRNG (random_int), hanya hash-nya yang disimpan;
 *  - berlaku 10 menit dan sekali pakai;
 *  - maksimal 5 percobaan salah, setelah itu kode harus diminta ulang;
 *  - kirim ulang dibatasi jeda 60 detik.
 */
class OtpService
{
    public const VALID_MINUTES = 10;
    public const MAX_ATTEMPTS = 5;
    public const RESEND_SECONDS = 60;

    public const OK = 'ok';
    public const INVALID = 'invalid';
    public const EXPIRED = 'expired';
    public const LOCKED = 'locked';
    public const NONE = 'none';

    /** Buat OTP baru dan kirim ke email pengguna. */
    public function issue(User $user): void
    {
        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $user->forceFill([
            'otp_hash' => Hash::make($otp),
            'otp_expires_at' => now()->addMinutes(self::VALID_MINUTES),
            'otp_attempts' => 0,
            'otp_sent_at' => now(),
        ])->save();

        Mail::to($user->email)->send(new ActivationOtpMail($user->name, $otp, self::VALID_MINUTES));
    }

    /** Berapa detik lagi sebelum OTP boleh dikirim ulang (0 = boleh sekarang). */
    public function resendWaitSeconds(User $user): int
    {
        if (!$user->otp_sent_at) {
            return 0;
        }
        $elapsed = $user->otp_sent_at->diffInSeconds(now(), true);

        return max(0, (int) ceil(self::RESEND_SECONDS - $elapsed));
    }

    /** Cek kode. Bila cocok, akun diaktifkan dan OTP dihapus. */
    public function verify(User $user, string $code): string
    {
        if (!$user->otp_hash || !$user->otp_expires_at) {
            return self::NONE;
        }
        if ($user->otp_attempts >= self::MAX_ATTEMPTS) {
            return self::LOCKED;
        }
        if ($user->otp_expires_at->isPast()) {
            return self::EXPIRED;
        }
        if (!Hash::check($code, $user->otp_hash)) {
            $user->forceFill(['otp_attempts' => $user->otp_attempts + 1])->save();

            return ($user->otp_attempts >= self::MAX_ATTEMPTS) ? self::LOCKED : self::INVALID;
        }

        $user->forceFill([
            'status' => 'Aktif',
            'email_verified_at' => now(),
            'otp_hash' => null,
            'otp_expires_at' => null,
            'otp_attempts' => 0,
        ])->save();

        return self::OK;
    }
}
