<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Anak;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnakController extends Controller
{
    private const AGE_RE = '/^(\d{1,2})\s*(?:th|thn|tahun)?(?:\s*(\d{1,2})\s*(?:bln|bulan))?$/i';

    private const MESSAGES = [
        'name.required' => 'Nama anak wajib diisi.',
        'name.min' => 'Nama anak minimal 3 karakter.',
        'name.max' => 'Nama anak maksimal 100 karakter.',
        'name.regex' => 'Nama anak hanya boleh berisi huruf, spasi, titik, apostrof, dan tanda hubung.',
        'classLabel.required' => 'Kelas wajib diisi.',
        'classLabel.min' => 'Kelas minimal 2 karakter.',
        'classLabel.max' => 'Kelas maksimal 20 karakter.',
        'classLabel.regex' => 'Kelas hanya boleh huruf, angka, dan spasi (contoh: TK A1).',
        'gender.required' => 'Jenis kelamin wajib dipilih.',
        'gender.in' => 'Jenis kelamin tidak valid.',
        'ageDisplay.required' => 'Usia wajib diisi.',
        'ageDisplay.regex' => 'Format usia tidak valid. Gunakan contoh: 5th 8bln atau 5.',
        'heightCm.required' => 'Tinggi badan wajib diisi.',
        'heightCm.numeric' => 'Tinggi badan harus berupa angka.',
        'heightCm.between' => 'Tinggi badan harus antara 60 dan 160 cm.',
        'weightKg.required' => 'Berat badan wajib diisi.',
        'weightKg.numeric' => 'Berat badan harus berupa angka.',
        'weightKg.between' => 'Berat badan harus antara 5 dan 80 kg.',
        'alergi.required' => "Isi alergi, atau tulis '-' jika tidak ada.",
        'alergi.max' => 'Alergi maksimal 200 karakter.',
        'alergi.regex' => 'Alergi hanya boleh huruf, angka, koma, garis miring, dan tanda kurung.',
    ];

    /** Aturan dasar; $req = 'required' (tambah) atau 'sometimes' (ubah). */
    private function rules(string $req): array
    {
        return [
            'name' => [$req, 'string', 'min:3', 'max:100', "regex:/^[\\pL][\\pL .'-]*$/u"],
            'classLabel' => [$req, 'string', 'min:2', 'max:20', 'regex:/^[A-Za-z0-9][A-Za-z0-9 ]*$/'],
            'gender' => [$req, 'in:Laki-laki,Perempuan'],
            'ageDisplay' => [$req, 'string', 'max:12', 'regex:' . self::AGE_RE],
            'heightCm' => [$req, 'numeric', 'between:60,160'],
            'weightKg' => [$req, 'numeric', 'between:5,80'],
            'alergi' => [$req, 'string', 'max:200', 'regex:/^(-|[\\pL0-9 ,\\/()-]+)$/u'],
        ];
    }

    /** Usia harus 3-7 tahun (cakupan standar WHO) dan bulan 0-11. Mengembalikan [bulan, teks] atau pesan error. */
    private function parseAge(string $raw): array|string
    {
        preg_match(self::AGE_RE, trim($raw), $m);
        $years = (int) ($m[1] ?? 0);
        $months = (int) ($m[2] ?? 0);

        if ($months > 11) {
            return 'Jumlah bulan harus antara 0 sampai 11.';
        }
        if ($years < 3 || $years > 7) {
            return 'Usia harus antara 3 dan 7 tahun (cakupan standar WHO).';
        }

        return [$years * 12 + $months, "{$years}th {$months}bln"];
    }

    private function normalize(Request $request): void
    {
        $clean = [];
        foreach (['name', 'classLabel', 'ageDisplay', 'alergi'] as $key) {
            if ($request->has($key) && is_string($request->input($key))) {
                $clean[$key] = preg_replace('/\s+/', ' ', trim($request->input($key)));
            }
        }
        $request->merge($clean);
    }

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
        $this->normalize($request);
        $validated = $request->validate($this->rules('required'), self::MESSAGES);

        $age = $this->parseAge($validated['ageDisplay']);
        if (is_string($age)) {
            return response()->json([
                'success' => false,
                'message' => $age,
                'errors' => ['ageDisplay' => [$age]],
            ], 422);
        }
        [$ageMonths, $ageDisplay] = $age;

        $anak = Anak::create([
            'nama' => $validated['name'],
            'kelas' => $validated['classLabel'],
            'jenis_kelamin' => $validated['gender'],
            'usia_bulan' => $ageMonths,
            'usia_display' => $ageDisplay,
            'tinggi_badan' => $validated['heightCm'],
            'berat_badan' => $validated['weightKg'],
            'alergi' => $validated['alergi'],
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

        $this->normalize($request);
        $validated = $request->validate($this->rules('sometimes'), self::MESSAGES);

        if (isset($validated['ageDisplay'])) {
            $age = $this->parseAge($validated['ageDisplay']);
            if (is_string($age)) {
                return response()->json([
                    'success' => false,
                    'message' => $age,
                    'errors' => ['ageDisplay' => [$age]],
                ], 422);
            }
            [$anak->usia_bulan, $anak->usia_display] = $age;
        }

        if (isset($validated['name'])) $anak->nama = $validated['name'];
        if (isset($validated['classLabel'])) $anak->kelas = $validated['classLabel'];
        if (isset($validated['gender'])) $anak->jenis_kelamin = $validated['gender'];
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

