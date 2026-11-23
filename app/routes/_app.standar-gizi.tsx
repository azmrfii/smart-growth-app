import { IconDatabase, IconEdit, IconInfoCircle, IconUsers } from "@tabler/icons-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";

import { NUTRITION_STANDARDS, NUTRITION_STATUS_STYLES, type WhoStandardRow } from "@/lib/nutrition-status";
import { SmartGrowthAPI } from "@/lib/api-client";
import { Modal } from "@/components/app-shell/Modal";
import { useAppStore } from "@/lib/nutrition-store";

export function meta() {
  return [{ title: "Standar Gizi - Sistem Gizi" }];
}

const inputClass =
  "h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm text-[#0A0A0A] outline-none focus:border-[#0891B2] aria-[invalid=true]:border-[#E7000B]";

export default function StandarGiziRoute() {
  const whoData = useAppStore((state) => state.standards);
  const setStandards = useAppStore((state) => state.setStandards);
  const notify = useAppStore((state) => state.notify);
  const [isFromDb, setIsFromDb] = useState(false);

  const [editing, setEditing] = useState<WhoStandardRow | null>(null);
  const [mean, setMean] = useState("");
  const [sd, setSd] = useState("");
  const [errors, setErrors] = useState<{ mean?: string; sd?: string }>({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    SmartGrowthAPI.getStandardGizi().then((res) => {
      if (res && res.success && Array.isArray(res.tableWHO) && res.tableWHO.length > 0) {
        setStandards(
          res.tableWHO.map((r: any) => ({
            ...r,
            mean_tinggi: Number(r.mean_tinggi),
            sd_tinggi: Number(r.sd_tinggi),
          })),
        );
        setIsFromDb(true);
      }
    });
  }, [setStandards]);

  const openEdit = (row: WhoStandardRow) => {
    setEditing(row);
    setMean(String(row.mean_tinggi));
    setSd(String(row.sd_tinggi));
    setErrors({});
    setServerError("");
  };

  const simpanStandar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing || saving) return;
    const meanNum = Number(mean.replace(",", "."));
    const sdNum = Number(sd.replace(",", "."));
    const found: { mean?: string; sd?: string } = {};
    if (!mean.trim() || Number.isNaN(meanNum)) found.mean = "Mean tinggi wajib berupa angka.";
    else if (meanNum < 30 || meanNum > 200) found.mean = "Mean tinggi harus antara 30 dan 200 cm.";
    if (!sd.trim() || Number.isNaN(sdNum)) found.sd = "SD wajib berupa angka.";
    else if (sdNum <= 0 || sdNum > 30) found.sd = "SD harus lebih dari 0 dan maksimal 30 (pembagi Z-Score).";
    setErrors(found);
    if (found.mean || found.sd) return;

    setSaving(true);
    const res =
      editing.id_standar !== undefined
        ? await SmartGrowthAPI.updateStandardGizi(editing.id_standar, { mean_tinggi: meanNum, sd_tinggi: sdNum })
        : null;
    setSaving(false);

    if (res && !res.ok && res.status !== 0) {
      setErrors({ mean: res.errors.mean_tinggi, sd: res.errors.sd_tinggi });
      setServerError(res.errors.mean_tinggi || res.errors.sd_tinggi ? "" : res.message);
      return;
    }

    setStandards(
      whoData.map((r) =>
        r === editing || (r.id_standar !== undefined && r.id_standar === editing.id_standar)
          ? { ...r, mean_tinggi: meanNum, sd_tinggi: sdNum }
          : r,
      ),
    );
    if (res?.ok) {
      SmartGrowthAPI.getKids().then((k) => {
        if (k?.success && Array.isArray(k.data) && k.data.length > 0) useAppStore.setState({ kids: k.data });
      });
    }
    notify("Standar Gizi Diperbarui", `Parameter ${editing.usia_tahun} tahun (${editing.jenis_kelamin}) berhasil disimpan`);
    setEditing(null);
  };

  return (
    <>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A0A0A]">Standar Gizi (Z-Score)</h1>
          <p className="text-sm text-[#4A5565]">
            Lihat dan ubah parameter standar gizi berdasarkan WHO untuk usia 3-7 tahun
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
                <th className="px-4 py-3 text-right">AKSI</th>
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
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      aria-label={`Edit standar ${row.usia_tahun} tahun ${row.jenis_kelamin}`}
                      className="inline-flex size-8 items-center justify-center rounded-lg text-[#4A5565] transition-colors hover:bg-slate-100 hover:text-[#0A0A0A]"
                    >
                      <IconEdit size={16} stroke={1.75} />
                    </button>
                  </td>
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

      {editing ? (
        <Modal
          title="Edit Parameter Standar Gizi"
          description={`${editing.usia_tahun} tahun (${editing.usia_bulan} bulan) - ${editing.jenis_kelamin}. Status gizi semua anak akan dihitung ulang otomatis.`}
          widthClass="max-w-[460px]"
          onClose={() => setEditing(null)}
        >
          <form onSubmit={simpanStandar} noValidate className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-[#1E1E1E]">Mean Tinggi (cm)</span>
              <input className={inputClass} inputMode="decimal" value={mean} aria-invalid={Boolean(errors.mean)} onChange={(e) => setMean(e.target.value)} />
              {errors.mean ? <span className="text-xs text-[#E7000B]">{errors.mean}</span> : null}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-[#1E1E1E]">Standard Deviation (SD)</span>
              <input className={inputClass} inputMode="decimal" value={sd} aria-invalid={Boolean(errors.sd)} onChange={(e) => setSd(e.target.value)} />
              {errors.sd ? <span className="text-xs text-[#E7000B]">{errors.sd}</span> : null}
            </label>
            {serverError ? (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-[#D4183D]">{serverError}</p>
            ) : null}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="h-9 rounded-lg border border-black/10 bg-white px-4 text-sm font-medium text-[#0A0A0A] hover:bg-black/5">
                Batal
              </button>
              <button type="submit" disabled={saving} className="h-9 rounded-lg bg-[#0891B2] px-4 text-sm font-medium text-white hover:bg-[#0E7490] disabled:opacity-70">
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  );
}
