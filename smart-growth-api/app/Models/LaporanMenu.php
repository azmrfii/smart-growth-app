<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LaporanMenu extends Model
{
    use HasFactory;

    protected $table = 'laporan_menu';
    protected $primaryKey = 'id_laporan';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_laporan',
        'id_rekomendasi',
        'tanggal',
        'waktu',
        'dibuat_oleh',
        'peran',
        'periode',
        'total_porsi',
        'status',
        'file_download',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'total_porsi' => 'integer',
    ];
}

