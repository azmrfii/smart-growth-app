<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/** Email berisi kode OTP aktivasi akun. */
class ActivationOtpMail extends Mailable
{
    public function __construct(
        public string $name,
        public string $otp,
        public int $validMinutes,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Kode Aktivasi Akun Smart Growth');
    }

    public function content(): Content
    {
        $name = e($this->name);
        $otp = e($this->otp);

        return new Content(htmlString: <<<HTML
            <p>Halo {$name},</p>
            <p>Akun Smart Growth Anda telah dibuat. Masukkan kode berikut untuk mengaktifkan akun:</p>
            <p style="font-size:28px;font-weight:bold;letter-spacing:6px">{$otp}</p>
            <p>Kode berlaku {$this->validMinutes} menit dan hanya dapat digunakan sekali.
            Jangan bagikan kode ini kepada siapa pun, termasuk pihak yang mengaku sebagai admin.</p>
            <p>Jika Anda tidak merasa mendaftar, abaikan email ini.</p>
            HTML);
    }
}
