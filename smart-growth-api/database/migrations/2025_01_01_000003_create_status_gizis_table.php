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
        Schema::create('status_gizi', function (Blueprint $table) {
            $table->id('id_pengukuran');
            $table->unsignedBigInteger('id_anak');
            $table->dateTime('tanggal_pengukuran')->useCurrent();
            $table->decimal('tinggi_badan', 5, 2);
            $table->decimal('berat_badan', 5, 2);
            $table->decimal('bmi', 4, 1)->nullable();
            $table->decimal('zscore_tb_u', 4, 2)->default(0.00);
            $table->decimal('zscore_bb_u', 4, 2)->default(0.00);
            $table->decimal('zscore_bb_tb', 4, 2)->default(0.00);
            $table->string('status_gizi', 50); // Gizi Buruk, Gizi Kurang, Gizi Baik, Gizi Lebih, Obesitas
            $table->text('interpretasi')->nullable();
            $table->timestamps();

            $table->foreign('id_anak')->references('id_anak')->on('anak')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('status_gizi');
    }
};

