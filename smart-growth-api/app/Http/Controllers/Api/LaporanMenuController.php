<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\LaporanMenu;
use App\Models\RekomendasiMenu;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class LaporanMenuController extends Controller
{
    /**
     * Use Case #7: Laporan Final Menu (FR-07, FR-08)
     * Lists approved final menu reports for Admin Dapur MBG.
     */
    public function index(): JsonResponse
    {
        $reports = LaporanMenu::orderByDesc('tanggal')->get();

        $jadwalMasak = [
            [
                'hari' => 'Senin',
                'kalori' => 575,
                'laukUtama' => 'Dada Ayam Panggang Herbal',
                'sayur' => 'Sup Bayam & Wortel Segar',
                'karbo' => 'Nasi Merah Organik',
                'buah' => 'Potongan Pepaya California',
                'alergiCatatan' => 'Bebas Kacang & Susu',
            ],
            [
                'hari' => 'Selasa',
                'kalori' => 590,
                'laukUtama' => 'Semur Telur Puyuh & Tempe',
                'sayur' => 'Tumis Buncis Jagung Manis',
                'karbo' => 'Nasi Putih Pulen',
                'buah' => 'Pisang Ambon Matang',
                'alergiCatatan' => 'Mengandung Telur & Kedelai',
            ],
            [
                'hari' => 'Rabu',
                'kalori' => 610,
                'laukUtama' => 'Fillet Ikan Kembung Kukus Jahe',
                'sayur' => 'Sayur Bening Labu Siam',
                'karbo' => 'Kentang Tumbuk (Mashed Potato)',
                'buah' => 'Jeruk Manis Kupas',
                'alergiCatatan' => 'Mengandung Ikan Laut',
            ],
            [
                'hari' => 'Kamis',
                'kalori' => 580,
                'laukUtama' => 'Rolade Daging Cincang Sayur',
                'sayur' => 'Capcay Sayur Warna-Warni',
                'karbo' => 'Nasi Putih Pulen',
                'buah' => 'Potongan Semangka Merah',
                'alergiCatatan' => 'Bebas Kacang & Seafood',
            ],
            [
                'hari' => 'Jumat',
                'kalori' => 600,
                'laukUtama' => 'Tahu Bakso Kukus Kuah Kaldu',
                'sayur' => 'Sup Jamur Tiram & Jagung',
                'karbo' => 'Nasi Merah Organik',
                'buah' => 'Melon Madu Segar',
                'alergiCatatan' => 'Mengandung Kedelai',
            ],
        ];

        return response()->json([
            'success' => true,
            'reports' => $reports,
            'jadwalMasak' => $jadwalMasak,
        ]);
    }

    /**
     * Use Case #7: Generate / Download PDF (FR-09)
     * Returns an HTML document styled for printing / downloading as PDF.
     */
    public function downloadPdf($id): Response
    {
        $report = LaporanMenu::where('id_laporan', $id)->first();
        $rekomendasi = null;

        if ($report && $report->id_rekomendasi) {
            $rekomendasi = RekomendasiMenu::find($report->id_rekomendasi);
        }

        AuditLog::record(
            'DOWNLOAD_LAPORAN_PDF',
            "Admin Dapur mengunduh laporan PDF final menu: {$id}",
            request()->user()
        );

        $periode = $report ? $report->periode : 'Minggu ke-4 November 2025';
        $tanggal = $report ? $report->tanggal->format('d F Y') : date('d F Y');
        $ahliGizi = $report ? $report->dibuat_oleh : 'Dr. Ratna Dewi';

        $html = <<<HTML
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Final Menu Gizi - Dapur MBG</title>
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; padding: 40px; margin: 0; }
        .header { border-bottom: 3px solid #0891B2; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
        .title { font-size: 24px; font-weight: bold; color: #0891B2; margin: 0; }
        .sub { font-size: 13px; color: #64748b; margin-top: 5px; }
        .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 25px; }
        .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
        th { background-color: #0891B2; color: #ffffff; text-align: left; padding: 10px 14px; border: 1px solid #0891B2; }
        td { padding: 10px 14px; border: 1px solid #e2e8f0; vertical-align: top; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background: #e0f2fe; color: #0369a1; }
        .footer { margin-top: 50px; display: flex; justify-content: space-between; font-size: 13px; }
        .signature { margin-top: 60px; font-weight: bold; text-decoration: underline; }
        @media print {
            body { padding: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1 class="title">SISTEM DETEKSI & REKOMENDASI MENU GIZI (SMART GROWTH)</h1>
            <div class="sub">PROGRAM MAKAN BERGIZI GRATIS (DAPUR MBG) • DOKUMEN LAPORAN RESMI</div>
        </div>
    </div>

    <div class="meta-box">
        <div class="meta-grid">
            <div><strong>Periode:</strong> {$periode}</div>
            <div><strong>Tanggal Validasi:</strong> {$tanggal}</div>
            <div><strong>Status:</strong> <span class="badge">DISETUJUI</span></div>
            <div><strong>Disetujui Oleh:</strong> {$ahliGizi}</div>
            <div><strong>Peran:</strong> Ahli Gizi Tersertifikasi</div>
            <div><strong>Sasaran:</strong> 120 Porsi Siswa / Hari</div>
        </div>
    </div>

    <h3>Rincian Menu Makan Siang Harian (Senin - Jumat)</h3>
    <table>
        <thead>
            <tr>
                <th>HARI</th>
                <th>LAUK UTAMA (PROTEIN)</th>
                <th>SAYURAN</th>
                <th>KARBOHIDRAT</th>
                <th>BUAH</th>
                <th>TOTAL ENERGI</th>
                <th>CATATAN ALERGI</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Senin</strong></td>
                <td>Dada Ayam Panggang Herbal</td>
                <td>Sup Bayam & Wortel Segar</td>
                <td>Nasi Merah Organik</td>
                <td>Pepaya California</td>
                <td>575 kal</td>
                <td>Bebas Kacang & Susu</td>
            </tr>
            <tr>
                <td><strong>Selasa</strong></td>
                <td>Semur Telur Puyuh & Tempe</td>
                <td>Tumis Buncis Jagung Manis</td>
                <td>Nasi Putih Pulen</td>
                <td>Pisang Ambon</td>
                <td>590 kal</td>
                <td>Mengandung Telur & Kedelai</td>
            </tr>
            <tr>
                <td><strong>Rabu</strong></td>
                <td>Fillet Ikan Kembung Kukus</td>
                <td>Sayur Bening Labu Siam</td>
                <td>Kentang Tumbuk</td>
                <td>Jeruk Manis</td>
                <td>610 kal</td>
                <td>Mengandung Ikan Laut</td>
            </tr>
            <tr>
                <td><strong>Kamis</strong></td>
                <td>Rolade Daging Sapi & Sayur</td>
                <td>Capcay Brokoli & Wortel</td>
                <td>Nasi Putih Pulen</td>
                <td>Semangka Merah</td>
                <td>580 kal</td>
                <td>Bebas Alergen Utama</td>
            </tr>
            <tr>
                <td><strong>Jumat</strong></td>
                <td>Tahu Bakso Kukus Kuah Kaldu</td>
                <td>Sup Jamur Tiram & Jagung</td>
                <td>Nasi Merah Organik</td>
                <td>Melon Madu Segar</td>
                <td>600 kal</td>
                <td>Mengandung Kedelai</td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        <div>
            <p>Mengetahui,</p>
            <p>Admin Dapur MBG</p>
            <div class="signature">Budi Santoso</div>
        </div>
        <div>
            <p>Disetujui oleh,</p>
            <p>Ahli Gizi Smart Growth</p>
            <div class="signature">{$ahliGizi}</div>
        </div>
    </div>
</body>
</html>
HTML;

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Content-Disposition' => 'inline; filename="Laporan_Menu.html"',
        ]);
    }
}

