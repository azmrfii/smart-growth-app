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
        Schema::create('laporan_menu', function (Blueprint $table) {
            $table->string('id_laporan')->primary(); // e.g. rep-1
            $table->string('id_rekomendasi')->nullable();
            $table->date('tanggal');
            $table->string('waktu', 20)->default('16.41');
            $table->string('dibuat_oleh')->default('Dr. Ratna Dewi');
            $table->string('peran')->default('Ahli Gizi');
            $table->string('periode');
            $table->integer('total_porsi')->default(120);
            $table->enum('status', ['Disetujui', 'Diproses', 'Draft'])->default('Disetujui');
            $table->string('file_download');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('laporan_menu');
    }
};

