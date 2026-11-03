<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\StandardGizi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StandardGiziController extends Controller
{
    /**
     * Use Case #4: Check Standard Gizi (FR-03)
     * Lists WHO reference standards for ages 3-7 years.
     */
    public function index(): JsonResponse
    {
        $standards = StandardGizi::orderBy('usia_tahun')->orderBy('jenis_kelamin')->get();

        $categories = [
            [
                'status' => 'Gizi Buruk',
                'zScore' => 'Z-Score < -3 SD',
                'description' => 'Sangat kurus / stunting berat. Memerlukan penanganan gizi darurat dan penambahan kalori tinggi.',
            ],
            [
                'status' => 'Gizi Kurang',
                'zScore' => '-3 SD ≤ Z-Score < -2 SD',
                'description' => 'Berat atau tinggi di bawah rata-rata. Perlu asupan protein dan kalori terarah.',
            ],
            [
                'status' => 'Gizi Baik',
                'zScore' => '-2 SD ≤ Z-Score ≤ +2 SD',
                'description' => 'Status gizi optimal dan proporsional sesuai acuan populasi standar WHO.',
            ],
            [
                'status' => 'Gizi Lebih',
                'zScore' => '+2 SD < Z-Score ≤ +3 SD',
                'description' => 'Kelebihan berat badan. Perlu penyesuaian porsi dan pola makan seimbang serat.',
            ],
            [
                'status' => 'Obesitas',
                'zScore' => 'Z-Score > +3 SD',
                'description' => 'Kelebihan berat badan tingkat lanjut. Perlu diet rendah gula dan pembatasan kalori.',
            ],
        ];

        return response()->json([
            'success' => true,
            'formula' => 'Z-Score = (Nilai Pengukuran - Median Referensi) / Standar Deviasi (SD)',
            'categories' => $categories,
            'tableWHO' => $standards,
        ]);
    }

    /**
     * Update standard threshold (Super Admin only, FR-03)
     */
    public function update(Request $request, $id): JsonResponse
    {
        $standard = StandardGizi::findOrFail($id);

        $validated = $request->validate([
            'mean_tinggi' => 'sometimes|numeric',
            'sd_tinggi' => 'sometimes|numeric',
            'mean_berat' => 'sometimes|numeric',
            'sd_berat' => 'sometimes|numeric',
            'kebutuhan_kalori' => 'sometimes|integer',
        ]);

        $standard->update($validated);

        AuditLog::record(
            'UPDATE_STANDARD_GIZI',
            "Memperbarui parameter standar gizi ID {$id} ({$standard->usia_tahun} tahun - {$standard->jenis_kelamin})",
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Standar gizi berhasil diperbarui.',
            'data' => $standard,
        ]);
    }
}

