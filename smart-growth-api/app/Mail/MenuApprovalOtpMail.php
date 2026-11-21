<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/** Email berisi kode OTP untuk mengonfirmasi approve rekomendasi menu. */
class MenuApprovalOtpMail extends Mailable
{
    public function __construct(
        public string $name,
        public string $menuTitle,
        public string $otp,
        public int $validMinutes,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Kode Konfirmasi Approve Menu - Smart Growth');
    }

    public function content(): Content
    {
        $name = e($this->name);
        $title = e($this->menuTitle);
        $otp = e($this->otp);

        return new Content(htmlString: <<<HTML
            <p>Halo {$name},</p>
            <p>Anda meminta untuk menyetujui menu <strong>{$title}</strong>.
            Menu yang disetujui akan langsung didistribusikan ke Admin Dapur MBG.</p>
            <p>Masukkan kode berikut untuk mengonfirmasi:</p>
            <p style="font-size:28px;font-weight:bold;letter-spacing:6px">{$otp}</p>
            <p>Kode berlaku {$this->validMinutes} menit, hanya untuk menu ini, dan hanya dapat digunakan sekali.
            Jangan bagikan kode ini kepada siapa pun.</p>
            <p>Jika Anda tidak meminta approve menu, segera ganti password dan hubungi Super Admin.</p>
            HTML);
    }
}
