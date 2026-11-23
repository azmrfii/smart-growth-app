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

    public function findStandard(): ?StandardGizi
    {
        $standard = StandardGizi::where('jenis_kelamin', $this->jenis_kelamin)
            ->where('usia_bulan', '<=', $this->usia_bulan)
            ->orderByDesc('usia_bulan')
            ->first();

        return $standard ?: StandardGizi::where('jenis_kelamin', $this->jenis_kelamin)->first();
    }

    public function hitungZScoreDanStatus(): array
    {
        $standard = $this->findStandard();
        $zScore = ($standard && $standard->sd_tinggi > 0)
            ? ($this->tinggi_badan - $standard->mean_tinggi) / $standard->sd_tinggi
            : 0.0;

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

        return [$zScore, $status];
    }

    public function calculateAndSetStatusGizi(): string
    {
        [$zScore, $status] = $this->hitungZScoreDanStatus();

        $this->status_gizi = $status;
        $this->save();

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

    public static function recalculateAllStatusGizi(): int
    {
        $changed = 0;
        foreach (self::all() as $anak) {
            [, $status] = $anak->hitungZScoreDanStatus();
            if ($anak->status_gizi !== $status) {
                $anak->status_gizi = $status;
                $anak->save();
                $changed++;
            }
        }

        return $changed;
    }

    public static function getAllAnak()
    {
        return self::orderBy('nama')->get();
    }

    public static function anakList()
    {
        return self::getAllAnak();
    }

    public static function filterAnak(string $nama)
    {
        return self::where('nama', 'like', "%{$nama}%")->orderBy('nama')->get();
    }

    public static function getAnak($idAnak): ?self
    {
        return self::find($idAnak);
    }

    public static function tambahAnak(array $data): self
    {
        $anak = self::create($data);
        $anak->calculateAndSetStatusGizi();

        return $anak;
    }

    public static function editAnak($idAnak, array $data): self
    {
        $anak = self::findOrFail($idAnak);
        $anak->fill($data)->save();
        $anak->calculateAndSetStatusGizi();

        return $anak;
    }

    public static function deleteAnak($idAnak): bool
    {
        return (bool) self::findOrFail($idAnak)->delete();
    }

    public function heightInMeters(): float
    {
        return $this->tinggi_badan / 100.0;
    }
}
