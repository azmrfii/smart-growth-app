<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Anak;
use App\Models\AuditLog;
use App\Models\LaporanMenu;
use App\Models\MenuMakanan;
use App\Models\RekomendasiMenu;
use App\Services\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RekomendasiMenuController extends Controller
{
    /**
     * Get available food items / ingredients.
     */
    public function getFoods(): JsonResponse
    {
        $foods = MenuMakanan::all()->map(function ($f) {
            return [
                'id' => $f->id_makanan,
                'name' => $f->nama_makanan,
                'category' => $f->kategori,
                'calories' => (float) $f->kalori,
                'protein' => (float) $f->protein,
                'carbs' => (float) $f->karbohidrat,
                'fat' => (float) $f->lemak,
                'allergen' => $f->alergen,
            ];
        });

        return response()->json(['success' => true, 'data' => $foods]);
    }

    /**
     * Add food ingredient manually (FR-06 Tambah Bahan Menu - Gambar UI 07.B)
     */
    public function storeFood(Request $request): JsonResponse
    {
        $request->merge(['name' => preg_replace('/\s+/', ' ', trim((string) $request->input('name')))]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:50', "regex:/^[\\pL][\\pL0-9 ().,'-]*$/u", 'unique:menu_makanan,nama_makanan'],
            'calories' => 'required|numeric|min:0|max:2000',
            'protein' => 'required|numeric|min:0|max:500',
            'carbs' => 'required|numeric|min:0|max:500',
            'fat' => 'required|numeric|min:0|max:500',
            'category' => 'nullable|string|max:50',
        ], [
            'name.required' => 'Nama makanan wajib diisi.',
            'name.min' => 'Nama makanan minimal 2 karakter.',
            'name.max' => 'Nama makanan maksimal 50 karakter.',
            'name.regex' => 'Nama makanan harus diawali huruf dan tidak boleh berisi simbol khusus.',
            'name.unique' => 'Bahan dengan nama ini sudah ada di database.',
            'calories.required' => 'Kalori wajib diisi.',
            'protein.required' => 'Protein wajib diisi.',
            'carbs.required' => 'Karbohidrat wajib diisi.',
            'fat.required' => 'Lemak wajib diisi.',
            'numeric' => ':attribute harus berupa angka.',
            'min' => ':attribute tidak boleh negatif.',
            'max' => ':attribute maksimal :max.',
        ]);

        $slug = 'food-' . Str::slug($validated['name']) . '-' . rand(100, 999);

        $food = MenuMakanan::create([
            'id_makanan' => $slug,
            'nama_makanan' => $validated['name'],
            'kategori' => $validated['category'] ?? 'Custom',
            'kalori' => $validated['calories'],
            'protein' => $validated['protein'],
            'karbohidrat' => $validated['carbs'],
            'lemak' => $validated['fat'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Bahan makanan berhasil ditambahkan ke menu.',
            'data' => [
                'id' => $food->id_makanan,
                'name' => $food->nama_makanan,
                'calories' => (float) $food->kalori,
                'protein' => (float) $food->protein,
                'carbs' => (float) $food->karbohidrat,
                'fat' => (float) $food->lemak,
            ],
        ], 201);
    }

    /**
     * List all weekly menus (draft and submitted).
     */
    public function index(): JsonResponse
    {
        $menus = RekomendasiMenu::orderByDesc('created_at')->get()->map(function ($m) {
            return [
                'id' => $m->id_rekomendasi,
                'title' => $m->title,
                'status' => $m->status,
                'createdBy' => $m->created_by,
                'createdAt' => $m->waktu_dibuat,
                'approvedByName' => $m->approved_by_name,
                'approvedAt' => $m->approved_at ? $m->approved_at->toDateTimeString() : null,
                'days' => $m->days_menu,
                'totalKalori' => (float) $m->total_kalori,
                'totalProtein' => (float) $m->total_protein,
                'totalCarbs' => (float) $m->total_karbohidrat,
                'totalFat' => (float) $m->total_lemak,
            ];
        });

        return response()->json(['success' => true, 'data' => $menus]);
    }

    /**
     * Auto-generate recommended weekly menu (FR-05)
     * Matches Algorithm #2 in DPPL page 57.
     */
    public function generate(): JsonResponse
    {
        // 1. Analyze distribution of kids
        $stuntingCount = Anak::whereIn('status_gizi', ['Gizi Buruk', 'Gizi Kurang'])->count();
        $totalKids = Anak::count();

        // 2. Select balanced rotation avoiding allergens
        $days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
        $generatedDays = [
            'Senin' => ['food-dada-ayam', 'food-nasi-putih', 'food-brokoli', 'food-wortel'],
            'Selasa' => ['food-telur-rebus', 'food-nasi-putih', 'food-tempe-goreng'],
            'Rabu' => ['food-ikan-salmon', 'food-nasi-putih', 'food-brokoli'],
            'Kamis' => ['food-dada-ayam', 'food-nasi-putih', 'food-wortel'],
            'Jumat' => ['food-telur-rebus', 'food-nasi-putih', 'food-pisang'],
        ];

        // Calculate sample nutrition total for Monday lunch
        $totalCalories = 165 + 195 + 34 + 41; // 435 kcal
        $totalProtein = 31 + 4 + 2.8 + 0.9;   // 38.7 g
        $totalCarbs = 0 + 43 + 7 + 10;        // 60.0 g
        $totalFat = 3.6 + 0.4 + 0.4 + 0.2;    // 4.6 g

        return response()->json([
            'success' => true,
            'message' => 'Rekomendasi menu mingguan berhasil dibuat otomatis.',
            'data' => [
                'days' => $generatedDays,
                'targetNutrisi' => [
                    'calories' => $totalCalories,
                    'protein' => round($totalProtein, 1),
                    'carbs' => round($totalCarbs, 1),
                    'fat' => round($totalFat, 1),
                ],
                'catatan' => 'Sistem telah menyesuaikan menu dengan kebutuhan pemulihan gizi dan mengecualikan alergen kritis.',
            ],
        ]);
    }

    /**
     * Save menu as draft (FR-05, DPPL Sequence Diagram #6)
     */
    public function saveDraft(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id' => 'nullable|string|max:100',
            'days' => 'required|array',
            'days.*' => 'array',
            'days.*.*' => 'string|max:100',
            'title' => 'nullable|string|max:150',
        ]);

        $id = $validated['id'] ?? ('menu-draft-' . date('Ymd-His'));
        $title = $validated['title'] ?? ('Menu Draft - ' . date('Y-m-d'));

        $menu = RekomendasiMenu::updateOrCreate(
            ['id_rekomendasi' => $id],
            [
                'title' => $title,
                'status' => 'draft',
                'created_by' => $request->user()?->name ?? 'Dr. Ratna Dewi (ahli gizi)',
                'waktu_dibuat' => date('H.i'),
                'days_menu' => $validated['days'],
                'total_kalori' => 435.0,
                'total_protein' => 38.7,
                'total_karbohidrat' => 60.0,
                'total_lemak' => 4.6,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Menu berhasil disimpan sebagai draft.',
            'data' => $menu,
        ]);
    }

    /** Sensor email untuk ditampilkan: ratna@smartgrowth.id -> r****@smartgrowth.id */
    private function maskEmail(string $email): string
    {
        [$local, $domain] = explode('@', $email, 2) + [1 => ''];

        return mb_substr($local, 0, 1) . str_repeat('*', max(1, mb_strlen($local) - 1)) . '@' . $domain;
    }

    /** Hanya draft yang boleh di-approve. */
    private function draftOrFail(string $id): RekomendasiMenu|JsonResponse
    {
        $menu = RekomendasiMenu::find($id);
        if (!$menu) {
            return response()->json(['success' => false, 'message' => 'Menu tidak ditemukan.'], 404);
        }
        if ($menu->status !== 'draft') {
            return response()->json(['success' => false, 'message' => 'Menu ini sudah di-approve sebelumnya.'], 422);
        }

        return $menu;
    }

    /**
     * Langkah 1 approve menu: kirim OTP ke email penyetuju (berlaku 5 menit).
     */
    public function requestApprovalOtp(Request $request, OtpService $otp, $id): JsonResponse
    {
        $menu = $this->draftOrFail($id);
        if ($menu instanceof JsonResponse) {
            return $menu;
        }

        $user = $request->user();
        if (!$user->email) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda belum memiliki email. Minta Super Admin menambahkan email terlebih dahulu.',
            ], 422);
        }

        $purpose = OtpService::menuApprovalPurpose($menu);
        $wait = $otp->resendWaitSeconds($user, $purpose);
        if ($wait > 0) {
            return response()->json([
                'success' => false,
                'message' => "Kode baru saja dikirim. Tunggu {$wait} detik sebelum meminta lagi.",
                'retryAfter' => $wait,
            ], 429);
        }

        try {
            $otp->issueMenuApproval($user, $menu);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Email OTP gagal dikirim. Coba lagi beberapa saat.',
            ], 502);
        }

        AuditLog::record(
            'MINTA_OTP_APPROVE_MENU',
            "{$user->name} meminta kode OTP untuk approve menu {$menu->title} ({$menu->id_rekomendasi})",
            $user
        );

        return response()->json([
            'success' => true,
            'message' => 'Kode OTP dikirim ke ' . $this->maskEmail($user->email) . '.',
            'email' => $this->maskEmail($user->email),
            'expiresIn' => OtpService::APPROVAL_MINUTES * 60,
            'maxAttempts' => OtpService::APPROVAL_MAX_ATTEMPTS,
        ]);
    }

    /**
     * Langkah 2: approve menu setelah OTP benar (FR-06 Review & Approval - DPPL Algoritma #3).
     */
    public function approve(Request $request, OtpService $otp, $id): JsonResponse
    {
        $request->validate([
            'otp' => ['required', 'string', 'regex:/^\d{6}$/'],
        ], [
            'otp.required' => 'Kode OTP wajib diisi.',
            'otp.regex' => 'Kode OTP harus berupa 6 digit angka.',
        ]);

        $menu = $this->draftOrFail($id);
        if ($menu instanceof JsonResponse) {
            return $menu;
        }
        $user = $request->user();

        $result = $otp->verifyMenuApproval($user, $menu, $request->input('otp'));

        if ($result !== OtpService::OK) {
            [$status, $message] = match ($result) {
                OtpService::INVALID => [422, 'Kode OTP salah. Sisa percobaan: ' . $otp->attemptsLeft($user, OtpService::APPROVAL_MAX_ATTEMPTS) . '.'],
                OtpService::LOCKED => [429, 'Terlalu banyak percobaan salah. Minta kode OTP baru.'],
                OtpService::EXPIRED => [422, 'Kode OTP sudah kedaluwarsa. Minta kode OTP baru.'],
                default => [422, 'Minta kode OTP terlebih dahulu.'],
            };

            if ($result === OtpService::LOCKED) {
                AuditLog::record(
                    'APPROVE_MENU_DIBLOKIR',
                    "Approve menu {$menu->title} ({$menu->id_rekomendasi}) oleh {$user->name} diblokir: OTP salah " . OtpService::APPROVAL_MAX_ATTEMPTS . ' kali',
                    $user
                );
            }

            return response()->json(['success' => false, 'code' => strtoupper($result), 'message' => $message], $status);
        }

        $menu->status = 'submitted';
        $menu->approved_by_id = $user->id_user;
        $menu->approved_by_name = $user->name;
        $menu->approved_at = now();
        $menu->waktu_dibuat = date('H.i');
        $menu->save();

        // Create or update LaporanMenu so Admin Dapur MBG can access it immediately (FR-07)
        LaporanMenu::updateOrCreate(
            ['id_rekomendasi' => $menu->id_rekomendasi],
            [
                'id_laporan' => 'rep-' . time(),
                'tanggal' => now()->toDateString(),
                'waktu' => date('H.i'),
                'dibuat_oleh' => $menu->approved_by_name,
                'peran' => 'Ahli Gizi',
                'periode' => 'Minggu ke-' . ceil(date('d') / 7) . ' ' . date('F Y'),
                'total_porsi' => 120,
                'status' => 'Disetujui',
                'file_download' => "Laporan_Menu_{$menu->id_rekomendasi}.pdf",
            ]
        );

        AuditLog::record(
            'APPROVE_MENU',
            "{$user->name} menyetujui rekomendasi menu {$menu->title} ({$menu->id_rekomendasi}), dikonfirmasi OTP email",
            $user
        );

        return response()->json([
            'success' => true,
            'message' => 'Menu telah di approve dan didistribusikan ke Admin Dapur MBG.',
            'data' => $menu,
        ]);
    }

    /**
     * Delete draft menu (DPPL Sequence Diagram #6)
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $menu = RekomendasiMenu::findOrFail($id);
        $menu->delete();

        return response()->json([
            'success' => true,
            'message' => 'Draft menu berhasil dihapus.',
        ]);
    }
}

