<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StatusGizi extends Model
{
    use HasFactory;

    protected $table = 'status_gizi';
    protected $primaryKey = 'id_pengukuran';

    protected $fillable = [
        'id_anak',
        'tanggal_pengukuran',
        'tinggi_badan',
        'berat_badan',
        'bmi',
        'zscore_tb_u',
        'zscore_bb_u',
        'zscore_bb_tb',
        'status_gizi',
        'interpretasi',
    ];

    protected $casts = [
        'tanggal_pengukuran' => 'datetime',
        'tinggi_badan' => 'float',
        'berat_badan' => 'float',
        'bmi' => 'float',
        'zscore_tb_u' => 'float',
        'zscore_bb_u' => 'float',
        'zscore_bb_tb' => 'float',
    ];

    public function anak(): BelongsTo
    {
        return $this->belongsTo(Anak::class, 'id_anak', 'id_anak');
    }
}

