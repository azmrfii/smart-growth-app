<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Anak;
use App\Models\StandardGizi;
use App\Models\StatusGizi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StatusGiziController extends Controller
{
    /**
     * Use Case #5: Check Status Gizi (FR-04)
     * Returns distribution counts and percentages for cards, plus list of children with current status.
     */
    public function index(Request $request): JsonResponse
    {
        $allStatuses = ['Gizi Buruk', 'Gizi Kurang', 'Gizi Baik', 'Gizi Lebih', 'Obesitas'];
        $totalKids = Anak::count();

        $distribution = [];
        foreach ($allStatuses as $st) {
            $count = Anak::where('status_gizi', $st)->count();
            $percent = $totalKids > 0 ? (int) round(($count / $totalKids) * 100) : 0;
            $distribution[] = [
                'status' => $st,
                'count' => $count,
                'percent' => $percent,
            ];
        }

        // Optional filter
        $query = Anak::query();
        if ($request->filled('status') && $request->status !== 'Semua') {
            $query->where('status_gizi', $request->status);
        }
        if ($request->filled('search')) {
            $query->where('nama', 'like', "%{$request->search}%");
        }

        $kids = $query->orderBy('nama')->get()->map(function ($k) {
            $heightM = $k->tinggi_badan / 100;
            $bmi = $heightM > 0 ? round($k->berat_badan / ($heightM ** 2), 1) : 0;

            return [
                'id' => "kid-{$k->id_anak}",
                'id_anak' => $k->id_anak,
                'name' => $k->nama,
                'classLabel' => $k->kelas,
                'gender' => $k->jenis_kelamin,
                'ageYears' => (int) floor($k->usia_bulan / 12),
                'ageDisplay' => $k->usia_display,
                'heightCm' => (float) $k->tinggi_badan,
                'weightKg' => (float) $k->berat_badan,
                'bmi' => $bmi,
                'status' => $k->status_gizi,
                'alergi' => $k->alergi ?: '-',
            ];
        });

        return response()->json([
            'success' => true,
            'summary' => [
                'total' => $totalKids,
                'distribution' => $distribution,
            ],
            'data' => $kids,
        ]);
    }

    /**
     * Use Case #5 Step 6-12: Check specific child's Z-Score and detailed classification
     * Matches Gambar UI 06.B Halaman Check Status Gizi Anak
     */
    public function checkAnak($id): JsonResponse
    {
        $idAnak = is_numeric($id) ? $id : (int) str_replace('kid-', '', $id);
        $anak = Anak::findOrFail($idAnak);

        // Find reference standard
        $standard = StandardGizi::where('jenis_kelamin', $anak->jenis_kelamin)
            ->where('usia_bulan', '<=', $anak->usia_bulan)
            ->orderByDesc('usia_bulan')
            ->first();

        if (!$standard) {
            $standard = StandardGizi::where('jenis_kelamin', $anak->jenis_kelamin)->first();
        }

        $meanTinggi = $standard ? (float) $standard->mean_tinggi : 110.0;
        $sdTinggi = $standard ? (float) $standard->sd_tinggi : 4.5;

        // Z-score formula: (X - Median) / SD
        $zScore = round(($anak->tinggi_badan - $meanTinggi) / $sdTinggi, 2);

        $heightM = $anak->tinggi_badan / 100;
        $bmi = $heightM > 0 ? round($anak->berat_badan / ($heightM ** 2), 1) : 0;

        // Classification
        if ($zScore < -3.0) {
            $status = 'Gizi Buruk';
            $interpretation = 'Z-Score < -3: Gizi Buruk (Severely Malnourished). Butuh penanganan khusus segera.';
        } elseif ($zScore < -2.0) {
            $status = 'Gizi Kurang';
            $interpretation = '-3 SD ≤ Z-Score < -2 SD: Gizi Kurang (Undernourished). Perlu intervensi asupan tinggi protein.';
        } elseif ($zScore <= 2.0) {
            $status = 'Gizi Baik';
            $interpretation = '-2 SD ≤ Z-Score ≤ +2 SD: Gizi Baik (Normal). Pertahankan pola gizi seimbang.';
        } elseif ($zScore <= 3.0) {
            $status = 'Gizi Lebih';
            $interpretation = '+2 SD < Z-Score ≤ +3 SD: Gizi Lebih (Overweight). Perlu kontrol asupan gula dan karbohidrat.';
        } else {
            $status = 'Obesitas';
            $interpretation = 'Z-Score > +3: Obesitas (Obese). Perlu penyesuaian porsi kalori dan aktivitas fisik.';
        }

        // Save latest measurement
        $measurement = StatusGizi::create([
            'id_anak' => $anak->id_anak,
            'tanggal_pengukuran' => now(),
            'tinggi_badan' => $anak->tinggi_badan,
            'berat_badan' => $anak->berat_badan,
            'bmi' => $bmi,
            'zscore_tb_u' => $zScore,
            'status_gizi' => $status,
            'interpretasi' => $interpretation,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Perhitungan status gizi selesai.',
            'data' => [
                'id' => "kid-{$anak->id_anak}",
                'name' => $anak->nama,
                'classLabel' => $anak->kelas,
                'gender' => $anak->jenis_kelamin,
                'ageDisplay' => $anak->usia_display,
                'heightCm' => (float) $anak->tinggi_badan,
                'weightKg' => (float) $anak->berat_badan,
                'bmi' => $bmi,
                'zScore' => $zScore,
                'status' => $status,
                'alergi' => $anak->alergi ?: '-',
                'interpretation' => $interpretation,
                'standardReference' => [
                    'medianHeight' => $meanTinggi,
                    'standardDeviation' => $sdTinggi,
                ],
            ],
        ]);
    }
}

