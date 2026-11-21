<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');


/*
| Cek konfigurasi email (SMTP) tanpa harus membuat akun / approve menu.
|   php artisan mail:test                 -> kirim ke MAIL_USERNAME (diri sendiri)
|   php artisan mail:test nama@domain.com -> kirim ke alamat lain
| Password SMTP tidak pernah ditampilkan.
*/
Artisan::command('mail:test {to?}', function (?string $to = null) {
    $mailer = config('mail.default');
    $smtp = config('mail.mailers.smtp');
    $from = config('mail.from.address');
    $to = $to ?: $from;

    $this->line("Mailer   : {$mailer}");
    if ($mailer === 'smtp') {
        $this->line("Server   : {$smtp['host']}:{$smtp['port']} (scheme: " . ($smtp['scheme'] ?? '-') . ')');
        $this->line('Username : ' . ($smtp['username'] ?: '(kosong)'));
        $this->line('Password : ' . ($smtp['password'] ? '(terisi, ' . strlen(str_replace(' ', '', $smtp['password'])) . ' karakter)' : '(kosong)'));
    }
    $this->line("Pengirim : {$from}");

    if ($mailer === 'smtp' && (!$smtp['username'] || !$smtp['password'])) {
        $this->error('MAIL_USERNAME / MAIL_PASSWORD di .env belum diisi.');

        return 1;
    }
    if (!$to || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
        $this->error('Alamat tujuan tidak valid.');

        return 1;
    }

    try {
        \Illuminate\Support\Facades\Mail::raw(
            "Ini email uji dari Smart Growth.\nJika Anda menerimanya, pengiriman OTP lewat SMTP sudah berfungsi.",
            fn ($m) => $m->to($to)->subject('Uji Email Smart Growth')
        );
    } catch (\Throwable $e) {
        $this->error('Gagal mengirim: ' . $e->getMessage());
        if (str_contains($e->getMessage(), '535')) {
            $this->warn('Gmail menolak login. Pastikan memakai App Password (16 huruf), bukan password akun.');
        }

        return 1;
    }

    $this->info("Email uji terkirim ke {$to}. Cek kotak masuk (dan folder Spam).");

    return 0;
})->purpose('Kirim email uji untuk memastikan konfigurasi SMTP');
