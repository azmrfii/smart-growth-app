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
        Schema::create('standard_gizi', function (Blueprint $table) {
            $table->id('id_standar');
            $table->integer('usia_bulan');
            $table->integer('usia_tahun');
            $table->enum('jenis_kelamin', ['Laki-laki', 'Perempuan']);
            $table->decimal('mean_tinggi', 5, 2); // Median WHO TB (cm)
            $table->decimal('sd_tinggi', 5, 2);   // Standar Deviasi WHO TB
            $table->decimal('mean_berat', 5, 2)->default(15.0); // Median WHO BB (kg)
            $table->decimal('sd_berat', 5, 2)->default(2.0);   // SD BB
            $table->integer('kebutuhan_kalori')->default(1400); // kal
            $table->integer('kebutuhan_protein')->default(25);  // gram
            $table->integer('kebutuhan_karbohidrat')->default(180); // gram
            $table->integer('kebutuhan_lemak')->default(45);    // gram
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('standard_gizi');
    }
};

