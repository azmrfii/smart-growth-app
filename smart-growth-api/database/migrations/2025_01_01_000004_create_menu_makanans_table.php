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
        Schema::create('menu_makanan', function (Blueprint $table) {
            $table->string('id_makanan')->primary(); // e.g. food-dada-ayam
            $table->string('nama_makanan');
            $table->string('kategori')->default('Protein'); // Protein, Karbohidrat, Sayur, Buah
            $table->decimal('kalori', 6, 1)->default(0);
            $table->decimal('protein', 5, 1)->default(0);
            $table->decimal('karbohidrat', 5, 1)->default(0);
            $table->decimal('lemak', 5, 1)->default(0);
            $table->string('alergen')->default('-'); // e.g. 'Telur', 'Kacang'
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('menu_makanan');
    }
};

