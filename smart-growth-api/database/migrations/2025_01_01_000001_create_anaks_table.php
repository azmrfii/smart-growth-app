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
        Schema::create('anak', function (Blueprint $table) {
            $table->id('id_anak');
            $table->string('nama');
            $table->string('kelas', 50)->default('TK A1');
            $table->enum('jenis_kelamin', ['Laki-laki', 'Perempuan'])->default('Laki-laki');
            $table->date('tanggal_lahir')->nullable();
            $table->integer('usia_bulan')->default(60);
            $table->string('usia_display', 50)->default('5th 0bln');
            $table->decimal('tinggi_badan', 5, 2); // dalam cm, misal 102.50
            $table->decimal('berat_badan', 5, 2); // dalam kg, misal 15.50
            $table->string('alergi')->default('-');
            $table->string('status_gizi')->default('Gizi Baik');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('anak');
    }
};

