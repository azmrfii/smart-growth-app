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
        Schema::create('rekomendasi_menu', function (Blueprint $table) {
            $table->string('id_rekomendasi')->primary(); // e.g. menu-draft-1, menu-submitted-1
            $table->string('title');
            $table->enum('status', ['draft', 'submitted', 'approved'])->default('draft');
            $table->string('created_by')->default('Dr. Ratna Dewi (ahli gizi)');
            $table->unsignedBigInteger('approved_by_id')->nullable();
            $table->string('approved_by_name')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->string('waktu_dibuat')->default('16.41');
            $table->json('days_menu'); // JSON array: { Senin: [...], Selasa: [...], etc }
            $table->decimal('total_kalori', 6, 1)->default(0);
            $table->decimal('total_protein', 5, 1)->default(0);
            $table->decimal('total_karbohidrat', 5, 1)->default(0);
            $table->decimal('total_lemak', 5, 1)->default(0);
            $table->text('catatan_ahli_gizi')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rekomendasi_menu');
    }
};

