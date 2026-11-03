<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StandardGizi extends Model
{
    use HasFactory;

    protected $table = 'standard_gizi';
    protected $primaryKey = 'id_standar';

    protected $fillable = [
        'usia_bulan',
        'usia_tahun',
        'jenis_kelamin',
        'mean_tinggi',
        'sd_tinggi',
        'mean_berat',
        'sd_berat',
        'kebutuhan_kalori',
        'kebutuhan_protein',
        'kebutuhan_karbohidrat',
        'kebutuhan_lemak',
    ];

    protected $casts = [
        'mean_tinggi' => 'float',
        'sd_tinggi' => 'float',
        'mean_berat' => 'float',
        'sd_berat' => 'float',
        'kebutuhan_kalori' => 'integer',
        'kebutuhan_protein' => 'integer',
        'kebutuhan_karbohidrat' => 'integer',
        'kebutuhan_lemak' => 'integer',
    ];
}

