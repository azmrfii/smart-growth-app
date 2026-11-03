<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Anak;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnakController extends Controller
{
    /**
     * Use Case #3: Mengelola Data Anak (FR-02) - List & search children
     */
    public function index(Request $request): JsonResponse
    {
        $query = Anak::query();

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('nama', 'like', "%{$s}%")
                  ->orWhere('kelas', 'like', "%{$s}%")
                  ->orWhere('alergi', 'like', "%{$s}%");
            });
        }

        if ($request->filled('kelas')) {
            $query->where('kelas', $request->kelas);
        }

        if ($request->filled('status_gizi') && $request->status_gizi !== 'Semua') {
            $query->where('status_gizi', $request->status_gizi);
        }

        $kids = $query->orderBy('nama')->get()->map(function ($k) {
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
                'status' => $k->status_gizi,
                'alergi' => $k->alergi ?: '-',
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $kids,
            'total' => $kids->count(),
        ]);
    }

    /**
     * Show single child detail (FR-02)
     */
    public function show($id): JsonResponse
    {
        $idAnak = is_numeric($id) ? $id : (int) str_replace('kid-', '', $id);
        $k = Anak::with('statusGiziList')->findOrFail($idAnak);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => "kid-{$k->id_anak}",
                'id_anak' => $k->id_anak,
                'name' => $k->nama,
                'classLabel' => $k->kelas,
                'gender' => $k->jenis_kelamin,
                'ageYears' => (int) floor($k->usia_bulan / 12),
                'ageDisplay' => $k->usia_display,
                'heightCm' => (float) $k->tinggi_badan,
                'weightKg' => (float) $k->berat_badan,
                'status' => $k->status_gizi,
                'alergi' => $k->alergi ?: '-',
                'riwayatPengukuran' => $k->statusGiziList,
            ],
        ]);
    }

    /**
     * Store a newly created child (FR-02 Tambah Data Anak)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'classLabel' => 'required|string|max:50',
            'gender' => 'required|in:Laki-laki,Perempuan',
            'ageDisplay' => 'nullable|string',
            'ageYears' => 'nullable|numeric',
            'heightCm' => 'required|numeric|min:30|max:200',
            'weightKg' => 'required|numeric|min:2|max:150',
            'alergi' => 'nullable|string',
        ]);

        $years = (int) ($validated['ageYears'] ?? 5);
        $ageDisplay = $validated['ageDisplay'] ?? "{$years}th 0bln";
        $ageMonths = $years * 12;

        $anak = Anak::create([
            'nama' => $validated['name'],
            'kelas' => $validated['classLabel'],
            'jenis_kelamin' => $validated['gender'],
            'usia_bulan' => $ageMonths,
            'usia_display' => $ageDisplay,
            'tinggi_badan' => $validated['heightCm'],
            'berat_badan' => $validated['weightKg'],
            'alergi' => $validated['alergi'] ?: '-',
            'status_gizi' => 'Gizi Baik', // initial before calculation
        ]);

        // Auto-calculate Z-Score and set status gizi
        $anak->calculateAndSetStatusGizi();

        AuditLog::record(
            'TAMBAH_ANAK',
            "Staf Tata Usaha menambahkan data anak {$anak->nama} ({$anak->kelas})",
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Data anak berhasil ditambahkan.',
            'data' => [
                'id' => "kid-{$anak->id_anak}",
                'id_anak' => $anak->id_anak,
                'name' => $anak->nama,
                'classLabel' => $anak->kelas,
                'gender' => $anak->jenis_kelamin,
                'ageYears' => (int) floor($anak->usia_bulan / 12),
                'ageDisplay' => $anak->usia_display,
                'heightCm' => (float) $anak->tinggi_badan,
                'weightKg' => (float) $anak->berat_badan,
                'status' => $anak->status_gizi,
                'alergi' => $anak->alergi,
            ],
        ], 201);
    }

    /**
     * Update an existing child (FR-02 Edit Data Anak)
     */
    public function update(Request $request, $id): JsonResponse
    {
        $idAnak = is_numeric($id) ? $id : (int) str_replace('kid-', '', $id);
        $anak = Anak::findOrFail($idAnak);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'classLabel' => 'sometimes|string|max:50',
            'gender' => 'sometimes|in:Laki-laki,Perempuan',
            'ageDisplay' => 'nullable|string',
            'heightCm' => 'sometimes|numeric|min:30|max:200',
            'weightKg' => 'sometimes|numeric|min:2|max:150',
            'alergi' => 'nullable|string',
            'status' => 'nullable|string',
        ]);

        if (isset($validated['name'])) $anak->nama = $validated['name'];
        if (isset($validated['classLabel'])) $anak->kelas = $validated['classLabel'];
        if (isset($validated['gender'])) $anak->jenis_kelamin = $validated['gender'];
        if (isset($validated['ageDisplay'])) $anak->usia_display = $validated['ageDisplay'];
        if (isset($validated['heightCm'])) $anak->tinggi_badan = $validated['heightCm'];
        if (isset($validated['weightKg'])) $anak->berat_badan = $validated['weightKg'];
        if (isset($validated['alergi'])) $anak->alergi = $validated['alergi'];

        $anak->save();

        // Recalculate Z-Score
        $anak->calculateAndSetStatusGizi();

        AuditLog::record(
            'EDIT_ANAK',
            "Memperbarui data anak {$anak->nama} (ID: {$anak->id_anak})",
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Data anak berhasil diperbarui.',
            'data' => [
                'id' => "kid-{$anak->id_anak}",
                'id_anak' => $anak->id_anak,
                'name' => $anak->nama,
                'classLabel' => $anak->kelas,
                'gender' => $anak->jenis_kelamin,
                'ageYears' => (int) floor($anak->usia_bulan / 12),
                'ageDisplay' => $anak->usia_display,
                'heightCm' => (float) $anak->tinggi_badan,
                'weightKg' => (float) $anak->berat_badan,
                'status' => $anak->status_gizi,
                'alergi' => $anak->alergi,
            ],
        ]);
    }

    /**
     * Delete child record (FR-02 Hapus Data Anak)
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $idAnak = is_numeric($id) ? $id : (int) str_replace('kid-', '', $id);
        $anak = Anak::findOrFail($idAnak);
        $nama = $anak->nama;

        $anak->delete();

        AuditLog::record(
            'HAPUS_ANAK',
            "Menghapus data anak {$nama} (ID: {$idAnak})",
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => "Data anak {$nama} berhasil dihapus.",
        ]);
    }
}

