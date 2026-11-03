import { IconDatabase, IconInfoCircle, IconUsers } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { NUTRITION_STANDARDS, NUTRITION_STATUS_STYLES } from "@/lib/nutrition-status";
import { SmartGrowthAPI } from "@/lib/api-client";

export function meta() {
  return [{ title: "Standar Gizi - Sistem Gizi" }];
}

type WhoStandardRow = {
  usia_bulan: number;
  usia_tahun: number;
  jenis_kelamin: string;
  mean_tinggi: number;
  sd_tinggi: number;
};

const DEFAULT_WHO_TABLE: WhoStandardRow[] = [
  { usia_bulan: 36, usia_tahun: 3, jenis_kelamin: "Laki-laki", mean_tinggi: 96.1, sd_tinggi: 3.7 },
  { usia_bulan: 36, usia_tahun: 3, jenis_kelamin: "Perempuan", mean_tinggi: 95.1, sd_tinggi: 3.9 },
  { usia_bulan: 48, usia_tahun: 4, jenis_kelamin: "Laki-laki", mean_tinggi: 103.3, sd_tinggi: 4.1 },
  { usia_bulan: 48, usia_tahun: 4, jenis_kelamin: "Perempuan", mean_tinggi: 102.7, sd_tinggi: 4.2 },
  { usia_bulan: 60, usia_tahun: 5, jenis_kelamin: "Laki-laki", mean_tinggi: 110.0, sd_tinggi: 4.3 },
  { usia_bulan: 60, usia_tahun: 5, jenis_kelamin: "Perempuan", mean_tinggi: 109.4, sd_tinggi: 4.5 },
  { usia_bulan: 72, usia_tahun: 6, jenis_kelamin: "Laki-laki", mean_tinggi: 116.0, sd_tinggi: 4.6 },
  { usia_bulan: 72, usia_tahun: 6, jenis_kelamin: "Perempuan", mean_tinggi: 115.5, sd_tinggi: 4.7 },
  { usia_bulan: 84, usia_tahun: 7, jenis_kelamin: "Laki-laki", mean_tinggi: 122.0, sd_tinggi: 5.0 },
  { usia_bulan: 84, usia_tahun: 7, jenis_kelamin: "Perempuan", mean_tinggi: 121.8, sd_tinggi: 5.2 },
];

export default function StandarGiziRoute() {
  const [whoData, setWhoData] = useState<WhoStandardRow[]>(DEFAULT_WHO_TABLE);
  const [isFromDb, setIsFromDb] = useState(false);

  useEffect(() => {
    SmartGrowthAPI.getStandardGizi().then((res) => {
      if (res && res.success && Array.isArray(res.tableWHO) && res.tableWHO.length > 0) {
        setWhoData(res.tableWHO);
        setIsFromDb(true);
      }
    });
  }, []);

  return (
    <>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A0A0A]">Standar Gizi (Z-Score)</h1>
          <p className="text-sm text-[#4A5565]">
            Kelola parameter standar gizi berdasarkan WHO untuk usia 3-7 tahun
          </p>
        </div>
        {isFromDb ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <IconDatabase size={14} />
            Terhubung ke Database MySQL
          </span>
        ) : null}
      </div>

      <div className="flex gap-3 rounded-[10px] border border-[#BEDBFF] bg-[#EFF6FF] p-4 text-sm text-[#193CB8]">
        <IconInfoCircle size={18} stroke={1.67} color="#193CB8" className="mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold">Standar gizi ini digunakan untuk menghitung status gizi anak usia 3-7 tahun.</p>
          <p className="mt-1 text-xs text-[#193CB8]/80">Formula Z-Score: (Tinggi Anak - Mean) / SD</p>
        </div>
      </div>

      {/* Kategori Klasifikasi */}
      <section className="flex flex-col gap-4 rounded-[14px] border border-black/10 bg-white p-6 shadow-xs">
        <h2 className="text-base font-bold text-[#0A0A0A]">Kategori Status Gizi Berdasarkan Z-Score</h2>
        <div className="overflow-x-auto rounded-lg border border-black/10">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead className="bg-[#F9FAFB] text-xs font-semibold text-[#64748B]">
              <tr className="border-b border-black/10">
                <th className="px-4 py-3">STATUS GIZI</th>
                <th className="px-4 py-3">RENTANG Z-SCORE</th>
                <th className="px-4 py-3">KETERANGAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {NUTRITION_STANDARDS.map((standard) => (
                <tr key={standard.status} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className={`rounded-lg px-2.5 py-0.5 text-xs font-medium ${NUTRITION_STATUS_STYLES[standard.status].badge}`}>
                      {standard.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#0A0A0A]">{standard.zScore}</td>
                  <td className="px-4 py-3 text-xs text-[#4A5565]">{standard.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tabel Parameter Rujukan WHO (Gambar UI 05.A DPPL) */}
      <section className="flex flex-col gap-4 rounded-[14px] border border-black/10 bg-white p-6 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-[#0A0A0A]">Tabel Standar Gizi WHO (3-7 Tahun)</h2>
          <p className="text-xs text-[#64748B]">Parameter rujukan tinggi badan berdasarkan usia dan jenis kelamin (Tabel DB: <code className="text-[#0891B2]">standard_gizi</code>)</p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-black/10">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead className="bg-[#F8FAFC] text-xs font-semibold text-[#64748B]">
              <tr className="border-b border-black/10">
                <th className="px-4 py-3">USIA (BULAN)</th>
                <th className="px-4 py-3">USIA (TAHUN)</th>
                <th className="px-4 py-3">JENIS KELAMIN</th>
                <th className="px-4 py-3">MEAN TINGGI (CM)</th>
                <th className="px-4 py-3">STANDARD DEVIATION (SD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 text-[#0F172A]">
              {whoData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{row.usia_bulan}</td>
                  <td className="px-4 py-3">{row.usia_tahun} tahun</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${row.jenis_kelamin === "Laki-laki" ? "bg-blue-50 text-blue-700" : "bg-pink-50 text-pink-700"}`}>
                      {row.jenis_kelamin}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-[#0891B2]">{row.mean_tinggi}</td>
                  <td className="px-4 py-3">{row.sd_tinggi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-2">
          <Link
            to="/data-anak"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-black/10 bg-white px-4 text-sm font-medium text-[#0A0A0A] hover:bg-black/5"
          >
            <IconUsers size={16} stroke={1.67} />
            Lihat Data Anak
          </Link>
        </div>
      </section>
    </>
  );
}
