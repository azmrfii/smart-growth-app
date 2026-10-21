import { IconSearch } from "@tabler/icons-react";
import { useMemo, useState } from "react";

import { useAppStore } from "@/lib/nutrition-store";
import {
  NUTRITION_STATUS_STYLES,
  NUTRITION_STATUSES,
  type NutritionStatus,
} from "@/lib/nutrition-status";

export function meta() {
  return [{ title: "Status Gizi - Sistem Gizi" }];
}

type StatusFilter = NutritionStatus | "Semua";

const calculateBmi = (weightKg: number, heightCm: number) =>
  (weightKg / (heightCm / 100) ** 2).toFixed(1);

export default function StatusGiziRoute() {
  const kids = useAppStore((state) => state.kids);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Semua");

  const total = kids.length;

  const counts = useMemo(
    () =>
      NUTRITION_STATUSES.map((status) => {
        const count = kids.filter((kid) => kid.status === status).length;
        const percent = total ? Math.round((count / total) * 100) : 0;
        return { status, count, percent };
      }),
    [kids, total],
  );

  const visibleKids = useMemo(() => {
    const term = query.trim().toLowerCase();
    return kids.filter(
      (kid) =>
        (statusFilter === "Semua" || kid.status === statusFilter) &&
        (!term || kid.name.toLowerCase().includes(term)),
    );
  }, [kids, query, statusFilter]);

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl text-[#0A0A0A]">Status Gizi</h1>
        <p className="text-base text-[#4A5565]">Ringkasan distribusi status gizi anak terdaftar</p>
      </div>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {counts.map(({ status, count, percent }) => {
          const isActive = statusFilter === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(isActive ? "Semua" : status)}
              aria-pressed={isActive}
              className={`flex flex-col gap-2 rounded-[10px] border p-4 text-left transition-shadow hover:shadow-md ${
                NUTRITION_STATUS_STYLES[status].card
              } ${isActive ? "ring-2 ring-[#0891B2]" : ""}`}
            >
              <span className="text-xs text-[#4A5565]">{status}</span>
              <span className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#0A0A0A]">{count}</span>
                <span className="text-sm text-[#4A5565]">({percent}%)</span>
              </span>
            </button>
          );
        })}
      </section>

      <section className="flex flex-col gap-4 rounded-[14px] border border-black/10 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-[#0A0A0A]">Daftar Status Anak</h2>
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative">
              <IconSearch
                size={18}
                stroke={1.5}
                color="#99A1AF"
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari nama"
                aria-label="Cari nama anak"
                className="h-9 w-56 rounded-lg bg-[#F3F3F5] pr-3 pl-9 text-sm text-[#0A0A0A] outline-none placeholder:text-[#717182] focus:ring-2 focus:ring-[#0891B2]/40"
              />
            </label>
            <select
              aria-label="Filter status gizi"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="h-9 rounded-lg border border-black/10 bg-white px-3 text-sm text-[#0A0A0A] outline-none focus:border-[#0891B2]"
            >
              <option value="Semua">Semua status</option>
              {NUTRITION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-black/10">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead className="bg-[#F9FAFB]">
              <tr className="border-b border-black/10">
                <th className="px-4 py-3 font-normal">Nama</th>
                <th className="px-4 py-3 font-normal">Usia</th>
                <th className="px-4 py-3 font-normal">TB (cm)</th>
                <th className="px-4 py-3 font-normal">BB (kg)</th>
                <th className="px-4 py-3 font-normal">IMT (kg/m²)</th>
                <th className="px-4 py-3 font-normal">Status Gizi</th>
              </tr>
            </thead>
            <tbody>
              {visibleKids.map((kid) => (
                <tr key={kid.id} className="border-b border-black/10 last:border-0 hover:bg-[#F9FAFB]">
                  <td className="px-4 py-3 text-[#0A0A0A]">{kid.name}</td>
                  <td className="px-4 py-3 text-[#4A5565]">{kid.ageYears} tahun</td>
                  <td className="px-4 py-3 text-[#4A5565]">{kid.heightCm}</td>
                  <td className="px-4 py-3 text-[#4A5565]">{kid.weightKg}</td>
                  <td className="px-4 py-3 text-[#4A5565]">{calculateBmi(kid.weightKg, kid.heightCm)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-lg px-2 py-0.5 text-xs ${NUTRITION_STATUS_STYLES[kid.status].badge}`}>
                      {kid.status}
                    </span>
                  </td>
                </tr>
              ))}
              {visibleKids.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#717182]">
                    Tidak ada anak dengan kriteria tersebut.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
