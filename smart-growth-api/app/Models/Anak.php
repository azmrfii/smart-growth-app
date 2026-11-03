<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Anak extends Model
{
    use HasFactory;

    protected $table = 'anak';
    protected $primaryKey = 'id_anak';

    protected $fillable = [
        'nama',
        'kelas',
        'jenis_kelamin',
        'tanggal_lahir',
        'usia_bulan',
        'usia_display',
        'tinggi_badan',
        'berat_badan',
        'alergi',
        'status_gizi',
    ];

    protected $casts = [
        'tinggi_badan' => 'float',
        'berat_badan' => 'float',
        'usia_bulan' => 'integer',
        'tanggal_lahir' => 'date',
    ];

    public function statusGiziList(): HasMany
    {
        return $this->hasMany(StatusGizi::class, 'id_anak', 'id_anak')->orderByDesc('tanggal_pengukuran');
    }

    /**
     * Calculate WHO Z-Score (TB/U) and classify status based on standard reference.
     */
    public function calculateAndSetStatusGizi(): string
    {
        // Find matching standard gizi by age in months (or nearest) and gender
        $standard = StandardGizi::where('jenis_kelamin', $this->jenis_kelamin)
            ->where('usia_bulan', '<=', $this->usia_bulan)
            ->orderByDesc('usia_bulan')
            ->first();

        if (!$standard) {
            $standard = StandardGizi::where('jenis_kelamin', $this->jenis_kelamin)->first();
        }

        if ($standard && $standard->sd_tinggi > 0) {
            // Z-Score = (Height - Median) / SD
            $zScore = ($this->tinggi_badan - $standard->mean_tinggi) / $standard->sd_tinggi;
        } else {
            // Fallback estimation
            $zScore = 0.0;
        }

        // Classification based on WHO Anthro Z-Score:
        // Z < -3 SD: Gizi Buruk
        // -3 SD <= Z < -2 SD: Gizi Kurang
        // -2 SD <= Z <= +2 SD: Gizi Baik
        // +2 SD < Z <= +3 SD: Gizi Lebih
        // Z > +3 SD: Obesitas
        if ($zScore < -3.0) {
            $status = 'Gizi Buruk';
        } elseif ($zScore < -2.0) {
            $status = 'Gizi Kurang';
        } elseif ($zScore <= 2.0) {
            $status = 'Gizi Baik';
        } elseif ($zScore <= 3.0) {
            $status = 'Gizi Lebih';
        } else {
            $status = 'Obesitas';
        }

        $this->status_gizi = $status;
        $this->save();

        // Also record to status_gizi history table
        StatusGizi::create([
            'id_anak' => $this->id_anak,
            'tanggal_pengukuran' => now(),
            'tinggi_badan' => $this->tinggi_badan,
            'berat_badan' => $this->berat_badan,
            'bmi' => $this->heightInMeters() > 0 ? round($this->berat_badan / ($this->heightInMeters() ** 2), 1) : null,
            'zscore_tb_u' => round($zScore, 2),
            'status_gizi' => $status,
            'interpretasi' => "Klasifikasi WHO Z-Score TB/U: {$status} (Z-Score: " . round($zScore, 2) . ")",
        ]);

        return $status;
    }

    public function heightInMeters(): float
    {
        return $this->tinggi_badan / 100.0;
    }
}

