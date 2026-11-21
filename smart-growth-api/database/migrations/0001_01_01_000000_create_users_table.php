<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id('id_user');
            $table->string('name');
            $table->string('username')->unique();
            // Email dipakai untuk aktivasi akun & pengiriman kode OTP.
            $table->string('email', 254)->unique()->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->enum('role', [
                'Super Admin',
                'Tata Usaha',
                'Admin dapur MBG',
                'Ahli Gizi'
            ])->default('Tata Usaha');
            $table->enum('status', ['Aktif', 'Nonaktif', 'Deleted', 'Menunggu Aktivasi'])->default('Aktif');
            // OTP aktivasi: hanya hash-nya yang disimpan, berlaku singkat, dan dibatasi percobaannya.
            $table->string('otp_hash')->nullable();
            // Tujuan OTP: 'activation' atau 'approve_menu:{id}' (kode hanya berlaku untuk tujuannya).
            $table->string('otp_purpose', 120)->nullable();
            $table->timestamp('otp_expires_at')->nullable();
            $table->unsignedTinyInteger('otp_attempts')->default(0);
            $table->timestamp('otp_sent_at')->nullable();
            $table->string('avatar_initials', 10)->nullable();
            $table->string('default_page')->default('/data-anak');
            $table->string('api_token', 80)->unique()->nullable()->default(null);
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('users');
    }
};

