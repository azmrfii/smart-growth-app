import { IconAlertTriangle, IconHeartRateMonitor, IconSearch } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";

import { Modal } from "@/components/app-shell/Modal";
import { useAppStore, type Kid } from "@/lib/nutrition-store";
import { SmartGrowthAPI } from "@/lib/api-client";
import {
  NUTRITION_STATUS_STYLES,
  NUTRITION_STATUSES,
  calculateStatusGizi,
  STATUS_INTERPRETATION,
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
  const currentUser = useAppStore((state) => state.currentUser);
  const standards = useAppStore((state) => state.standards);
  const canCheck = currentUser?.role === "Ahli Gizi";
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState("");
  const [checkResult, setCheckResult] = useState<{
    kid: Kid;
    zScore: number;
    status: NutritionStatus;
    bmi: number;
    interpretation: string;
  } | null>(null);

  const pilihAnakForCheckGizi = async (kid: Kid) => {
    if (checking) return;
    setChecking(true);
    setCheckError("");
    const res = await SmartGrowthAPI.getStatusGiziAnak(kid.id);
    setChecking(false);
    if (res.ok) {
      const d = res.data.data;
      setCheckResult({ kid, zScore: d.zScore, status: d.status, bmi: d.bmi, interpretation: d.interpretation });
    } else if (res.status === 0) {
      const r = calculateStatusGizi(kid, standards);
      setCheckResult({ kid, zScore: r.zScore, status: r.status, bmi: r.bmi, interpretation: r.interpretation });
    } else {
      setCheckError(res.message);
    }
  };

  useEffect(() => {
    SmartGrowthAPI.getKids().then((res) => {
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        useAppStore.setState({ kids: res.data });
      }
    });
  }, []);

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
                maxLength={100}
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
                <th className="px-4 py-3 font-normal">Alergi</th>
                {canCheck ? <th className="px-4 py-3 text-right font-normal">Detail</th> : null}
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
                  <td className="px-4 py-3">
                    {kid.alergi && kid.alergi !== "-" ? (
                      <span title={kid.alergi} className="inline-flex items-center gap-1 rounded-full bg-[#D4183D] px-2.5 py-0.5 text-xs font-semibold text-white">
                        <IconAlertTriangle size={12} stroke={2.5} />
                        {kid.alergi.split(/[,/]/).filter(Boolean).length} alergi
                      </span>
                    ) : (
                      <span className="text-[#717182]">-</span>
                    )}
                  </td>
                  {canCheck ? (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => pilihAnakForCheckGizi(kid)}
                        disabled={checking}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#0891B2] px-3 text-xs font-semibold text-white hover:bg-[#0E7490] disabled:opacity-60"
                      >
                        <IconHeartRateMonitor size={14} stroke={2} />
                        Cek
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
              {visibleKids.length === 0 ? (
                <tr>
                  <td colSpan={canCheck ? 8 : 7} className="px-4 py-8 text-center text-[#717182]">
                    Tidak ada anak dengan kriteria tersebut.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {checking ? (
        <div role="status" className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-3 bg-white/40 backdrop-blur-sm">
          <span className="size-10 animate-spin rounded-full border-4 border-[#0891B2]/25 border-t-[#0891B2]" />
          <span className="text-sm font-semibold text-[#0E7490]">Menghitung status gizi...</span>
        </div>
      ) : null}

      {checkError ? (
        <Modal title="Gagal Menghitung Status Gizi" description={checkError} widthClass="max-w-[420px]" onClose={() => setCheckError("")}>
          <div className="flex justify-end">
            <button type="button" onClick={() => setCheckError("")} className="h-9 rounded-lg border border-black/10 px-4 text-sm hover:bg-black/5">Tutup</button>
          </div>
        </Modal>
      ) : null}

      {checkResult ? (
        <Modal
          title="Cek Status Gizi Anak"
          description="Z-Score dan status gizi berdasarkan data fisik anak (WHO Standards 3-7 tahun)"
          widthClass="max-w-[620px]"
          onClose={() => setCheckResult(null)}
        >
          <div className="flex flex-col gap-4">
            <dl className="grid grid-cols-2 gap-3 rounded-lg bg-[#F9FAFB] p-4 text-sm">
              {[
                ["Nama", checkResult.kid.name],
                ["Kelas", checkResult.kid.classLabel],
                ["Jenis Kelamin", checkResult.kid.gender],
                ["Usia", checkResult.kid.ageDisplay || `${checkResult.kid.ageYears}th`],
                ["Tinggi Badan", `${checkResult.kid.heightCm} cm`],
                ["Berat Badan", `${checkResult.kid.weightKg} kg`],
                ["Alergi", checkResult.kid.alergi || "-"],
                ["BMI", String(checkResult.bmi)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-[#717182]">{label}</dt>
                  <dd className="font-medium text-[#0A0A0A]">{value}</dd>
                </div>
              ))}
            </dl>
            <div className={`flex items-center justify-between rounded-lg border p-4 ${NUTRITION_STATUS_STYLES[checkResult.status].card}`}>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[#4A5565]">Status Gizi</span>
                <span className={`w-fit rounded-lg px-3 py-1 text-sm font-semibold ${NUTRITION_STATUS_STYLES[checkResult.status].badge}`}>
                  {checkResult.status}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#4A5565]">Z-Score (TB/U)</span>
                <p className="text-2xl font-bold text-[#0A0A0A]">{checkResult.zScore.toFixed(2)}</p>
              </div>
            </div>
            <p className="rounded-lg border border-black/10 p-3 text-xs text-[#4A5565]">
              <span className="font-semibold">Interpretasi: </span>
              {checkResult.interpretation || STATUS_INTERPRETATION[checkResult.status]}
            </p>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
