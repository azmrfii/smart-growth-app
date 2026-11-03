<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RekomendasiMenu extends Model
{
    use HasFactory;

    protected $table = 'rekomendasi_menu';
    protected $primaryKey = 'id_rekomendasi';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_rekomendasi',
        'title',
        'status',
        'created_by',
        'approved_by_id',
        'approved_by_name',
        'approved_at',
        'waktu_dibuat',
        'days_menu',
        'total_kalori',
        'total_protein',
        'total_karbohidrat',
        'total_lemak',
        'catatan_ahli_gizi',
    ];

    protected $casts = [
        'days_menu' => 'array',
        'approved_at' => 'datetime',
        'total_kalori' => 'float',
        'total_protein' => 'float',
        'total_karbohidrat' => 'float',
        'total_lemak' => 'float',
    ];
}

