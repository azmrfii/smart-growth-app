import {
  IconCalendar,
  IconCheck,
  IconChefHat,
  IconDownload,
  IconFileText,
  IconMeat,
  IconPrinter,
  IconSalad,
  IconToolsKitchen2,
} from "@tabler/icons-react";
import { useState } from "react";

import { useAppStore } from "@/lib/nutrition-store";

export function meta() {
  return [{ title: "Laporan Final Menu - Dapur MBG" }];
}

export type MenuReport = {
  id: string;
  tanggal: string;
  waktu: string;
  dibuatOleh: string;
  peran: string;
  periode: string;
  totalPorsi: number;
  status: "Disetujui" | "Diproses" | "Draft";
  fileDownload: string;
};

const INITIAL_REPORTS: MenuReport[] = [
  {
    id: "rep-1",
    tanggal: "2025-11-25",
    waktu: "16.41",
    dibuatOleh: "Dr. Ratna Dewi",
    peran: "Ahli Gizi",
    periode: "Minggu ke-4 November 2025 (25 - 29 Nov 2025)",
    totalPorsi: 120,
    status: "Disetujui",
    fileDownload: "Laporan_Menu_Minggu4_Nov2025.pdf",
  },
  {
    id: "rep-2",
    tanggal: "2025-11-18",
    waktu: "15.30",
    dibuatOleh: "Dr. Ratna Dewi",
    peran: "Ahli Gizi",
    periode: "Minggu ke-3 November 2025 (18 - 22 Nov 2025)",
    totalPorsi: 120,
    status: "Disetujui",
    fileDownload: "Laporan_Menu_Minggu3_Nov2025.pdf",
  },
  {
    id: "rep-3",
    tanggal: "2025-11-11",
    waktu: "14.15",
    dibuatOleh: "Dr. Ratna Dewi",
    peran: "Ahli Gizi",
    periode: "Minggu ke-2 November 2025 (11 - 15 Nov 2025)",
    totalPorsi: 120,
    status: "Disetujui",
    fileDownload: "Laporan_Menu_Minggu2_Nov2025.pdf",
  },
];

const JADWAL_MASAK_MINGGUAN = [
  {
    hari: "Senin",
    kalori: 575,
    laukUtama: "Dada Ayam Panggang Herbal",
    sayur: "Sup Bayam & Wortel Segar",
    karbo: "Nasi Merah Organik",
    buah: "Potongan Pepaya California",
    alergiCatatan: "Bebas Kacang & Susu",
  },
  {
    hari: "Selasa",
    kalori: 590,
    laukUtama: "Ikan Kembung Kukus Bumbu Kuning",
    sayur: "Tumis Buncis Jagung Manis",
    karbo: "Nasi Putih Pulen",
    buah: "Pisang Ambon",
    alergiCatatan: "Bebas Telur & Gluten",
  },
  {
    hari: "Rabu",
    kalori: 610,
    laukUtama: "Semur Daging Cincang Lembut",
    sayur: "Sup Sayur Brokoli Wortel",
    karbo: "Nasi Merah Organik",
    buah: "Jeruk Manis",
    alergiCatatan: "Rendah Garam & Minyak",
  },
  {
    hari: "Kamis",
    kalori: 560,
    laukUtama: "Ayam Suwir Bumbu Kuning & Tahu Kukus",
    sayur: "Sayur Bening Labu Siam",
    karbo: "Nasi Putih Pulen",
    buah: "Semangka Segar",
    alergiCatatan: "Aman untuk Alergi Seafood",
  },
  {
    hari: "Jumat",
    kalori: 580,
    laukUtama: "Rolade Ikan Tenggiri & Tempe Bacem",
    sayur: "Sup Jamur Kuping Sayur",
    karbo: "Nasi Merah Organik",
    buah: "Melon Segar",
    alergiCatatan: "Tinggi Kalsium Nabati",
  },
];

export default function LaporanMenuRoute() {
  const [reports] = useState<MenuReport[]>(INITIAL_REPORTS);
  const notify = useAppStore((state) => state.notify);

  const handleDownloadPdf = (fileName: string) => {
    notify("Mengunduh Laporan", `File ${fileName} sedang diunduh.`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A0A0A]">Laporan Final Menu MBG</h1>
          <p className="text-sm text-[#4A5565]">
            Akses dan unduh rekap menu mingguan yang telah disetujui Ahli Gizi untuk Dapur Makan Bergizi Gratis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 text-sm font-medium text-[#0A0A0A] shadow-xs transition hover:bg-slate-50"
          >
            <IconPrinter size={18} />
            <span>Cetak Menu Dapur</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-xs">
          <span className="text-xs text-[#64748B]">Target Porsi MBG / Hari</span>
          <p className="mt-1 text-2xl font-bold text-[#0F172A]">120 Porsi</p>
          <span className="text-[11px] text-emerald-600 font-medium">TK A & TK B Tercover</span>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-xs">
          <span className="text-xs text-[#64748B]">Status Menu Minggu Ini</span>
          <p className="mt-1 text-2xl font-bold text-emerald-600">Disetujui</p>
          <span className="text-[11px] text-[#64748B]">Oleh Dr. Ratna Dewi</span>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-xs">
          <span className="text-xs text-[#64748B]">Rata-rata Kalori / Porsi</span>
          <p className="mt-1 text-2xl font-bold text-[#0891B2]">583 kkal</p>
          <span className="text-[11px] text-[#64748B]">Standar Gizi Terpenuhi</span>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-xs">
          <span className="text-xs text-[#64748B]">Operasional Dapur</span>
          <p className="mt-1 text-base font-bold text-emerald-700">Siap Masak & Distribusi</p>
          <span className="text-[11px] text-[#64748B]">Bahan Baku Siap</span>
        </div>
      </div>

      <section className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-black/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <IconChefHat size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0A0A0A]">Jadwal Pengolahan Menu Mingguan (Dapur MBG)</h2>
              <p className="text-xs text-[#64748B]">Panduan takaran bahan dan komposisi makanan setiap hari</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          {JADWAL_MASAK_MINGGUAN.map((item) => (
            <div key={item.hari} className="flex flex-col rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-sm text-[#0F172A]">{item.hari}</span>
                <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                  {item.kalori} kkal
                </span>
              </div>

              <div className="mt-3 flex flex-col gap-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Karbohidrat</span>
                  <p className="font-medium text-slate-800">{item.karbo}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Lauk Utama</span>
                  <p className="font-medium text-slate-800">{item.laukUtama}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Sayur & Buah</span>
                  <p className="font-medium text-slate-800">{item.sayur}, {item.buah}</p>
                </div>
              </div>

              <div className="mt-3 border-t border-slate-200 pt-2 text-[10px] font-medium text-blue-700">
                Catatan: {item.alergiCatatan}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-bold text-[#0A0A0A]">Riwayat Laporan Final Menu</h2>
          <p className="text-xs text-[#64748B]">Daftar laporan resmi mingguan yang siap diunduh</p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-black/10">
          <table className="w-full min-w-[700px] border-collapse text-left text-sm">
            <thead className="bg-[#F8FAFC] text-xs font-semibold text-[#64748B]">
              <tr className="border-b border-black/10">
                <th className="px-4 py-3">PERIODE MINGGUAN</th>
                <th className="px-4 py-3">TANGGAL SUBMIT</th>
                <th className="px-4 py-3">DIBUAT OLEH</th>
                <th className="px-4 py-3">STATUS</th>
                <th className="px-4 py-3 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 text-[#0F172A]">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-[#F8FAFC]">
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      <IconCalendar size={16} className="text-[#0891B2]" />
                      <span>{report.periode}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#64748B]">
                    {report.tanggal} • {report.waktu}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="font-semibold block">{report.dibuatOleh}</span>
                    <span className="text-[#64748B]">{report.peran}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      <IconCheck size={14} />
                      {report.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(report.fileDownload)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#0891B2] bg-white px-3 py-1.5 text-xs font-medium text-[#0891B2] transition hover:bg-[#F0FDFA]"
                    >
                      <IconDownload size={14} />
                      <span>Unduh PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
