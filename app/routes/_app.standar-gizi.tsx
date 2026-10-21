import { IconInfoCircle, IconUsers } from "@tabler/icons-react";
import { Link } from "react-router";

import { NUTRITION_STANDARDS, NUTRITION_STATUS_STYLES } from "@/lib/nutrition-status";

export function meta() {
  return [{ title: "Standar Gizi - Sistem Gizi" }];
}

export default function StandarGiziRoute() {
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl text-[#0A0A0A]">Standar Gizi</h1>
        <p className="text-base text-[#4A5565]">Acuan kategori status gizi anak sebagai dasar perhitungan</p>
      </div>

      <div className="flex gap-3 rounded-[10px] border border-[#BEDBFF] bg-[#EFF6FF] p-4 text-sm text-[#193CB8]">
        <IconInfoCircle size={18} stroke={1.67} color="#193CB8" className="mt-0.5 shrink-0" />
        <p>Standar gizi ini digunakan untuk menghitung status gizi anak usia 3-7 tahun.</p>
      </div>

      <section className="flex flex-col gap-3 rounded-[14px] border border-black/10 bg-white p-6">
        <h2 className="text-base font-bold text-[#0A0A0A]">Formula Z-Score</h2>
        <p className="rounded-lg bg-[#F9FAFB] p-4 text-sm text-[#0A0A0A]">
          Z-Score = (Nilai Pengukuran - Median Referensi) / Standar Deviasi (SD)
        </p>
      </section>

      <section className="flex flex-col gap-4 rounded-[14px] border border-black/10 bg-white p-6">
        <h2 className="text-base font-bold text-[#0A0A0A]">Kategori Status Gizi</h2>
        <div className="overflow-x-auto rounded-lg border border-black/10">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead className="bg-[#F9FAFB]">
              <tr className="border-b border-black/10">
                <th className="px-4 py-3 font-normal">Status Gizi</th>
                <th className="px-4 py-3 font-normal">Rentang Z-Score</th>
                <th className="px-4 py-3 font-normal">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {NUTRITION_STANDARDS.map((standard) => (
                <tr key={standard.status} className="border-b border-black/10 last:border-0">
                  <td className="px-4 py-3">
                    <span className={`rounded-lg px-2 py-0.5 text-xs ${NUTRITION_STATUS_STYLES[standard.status].badge}`}>
                      {standard.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#0A0A0A]">{standard.zScore}</td>
                  <td className="px-4 py-3 text-[#4A5565]">{standard.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <Link
            to="/data-anak"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-black/10 bg-white px-4 text-sm text-[#0A0A0A] hover:bg-black/5"
          >
            <IconUsers size={16} stroke={1.67} />
            Lihat Data Anak
          </Link>
        </div>
      </section>
    </>
  );
}
