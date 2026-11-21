import {
  IconAlertTriangle,
  IconEdit,
  IconPlus,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { ConfirmDialog, Modal } from "@/components/app-shell/Modal";
import { GENDERS, useAppStore, type Gender, type Kid, type KidInput } from "@/lib/nutrition-store";
import { NUTRITION_STATUSES, type NutritionStatus } from "@/lib/nutrition-status";
import { SmartGrowthAPI } from "@/lib/api-client";
import { FieldError, fieldProps } from "@/components/app-shell/FieldError";
import {
  hasErrors,
  parseAge,
  parseNumber,
  validateKidForm,
  type FieldErrors,
  type KidFields,
} from "@/lib/validation";

export function meta() {
  return [{ title: "Data Anak - Sistem Gizi" }];
}

const STATUS_BADGE_CLASSES: Record<NutritionStatus, string> = {
  "Gizi Buruk": "bg-[#5B7C99] text-white",
  "Gizi Kurang": "bg-[#F59E0B] text-white",
  "Gizi Baik": "bg-[#008A2E] text-white",
  "Berisiko Gizi Lebih": "bg-[#0284C7] text-white",
  "Gizi Lebih": "bg-[#0284C7] text-white",
  Obesitas: "bg-[#851E28] text-white",
};

type FormState = {
  name: string;
  classLabel: string;
  gender: Gender;
  ageDisplay: string;
  heightCm: string;
  weightKg: string;
  status: NutritionStatus;
  alergi: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  classLabel: "TK A1",
  gender: "Laki-laki",
  ageDisplay: "5th 6bln",
  heightCm: "100",
  weightKg: "15",
  status: "Gizi Baik",
  alergi: "-",
};

const inputClass =
  "h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm text-[#0A0A0A] outline-none placeholder:text-[#B3B3B3] focus:border-[#0891B2] aria-[invalid=true]:border-[#E7000B] aria-[invalid=true]:bg-red-50/40";

export default function DataAnakRoute() {
  const kids = useAppStore((state) => state.kids);
  const addKid = useAppStore((state) => state.addKid);
  const updateKid = useAppStore((state) => state.updateKid);
  const deleteKid = useAppStore((state) => state.deleteKid);
  const resetKidsData = useAppStore((state) => state.resetKidsData);
  const notify = useAppStore((state) => state.notify);

  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingKid, setEditingKid] = useState<Kid | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors<KidFields>>({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    SmartGrowthAPI.getKids().then((res) => {
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        useAppStore.setState({ kids: res.data });
      }
    });
  }, []);

  const filteredKids = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return kids;
    return kids.filter(
      (kid) =>
        kid.name.toLowerCase().includes(term) ||
        kid.classLabel.toLowerCase().includes(term) ||
        (kid.alergi && kid.alergi.toLowerCase().includes(term)),
    );
  }, [kids, query]);

  const pendingDelete = kids.find((kid) => kid.id === pendingDeleteId);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => (current[key as KidFields] ? { ...current, [key]: undefined } : current));
  };

  const openAddForm = () => {
    setEditingKid(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowForm(true);
  };

  const openEditForm = (kid: Kid) => {
    setEditingKid(kid);
    setForm({
      name: kid.name,
      classLabel: kid.classLabel,
      gender: kid.gender,
      ageDisplay: kid.ageDisplay || `${kid.ageYears}th`,
      heightCm: String(kid.heightCm),
      weightKg: String(kid.weightKg),
      status: kid.status,
      alergi: kid.alergi || "-",
    });
    setErrors({});
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingKid(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setServerError("");
    const found = validateKidForm(form, { genders: GENDERS, statuses: NUTRITION_STATUSES });
    setErrors(found);
    if (hasErrors(found)) return;

    const heightCm = parseNumber(form.heightCm) as number;
    const weightKg = parseNumber(form.weightKg) as number;
    const parsedAgeYears = (parseAge(form.ageDisplay) as { years: number }).years;

    const kidData: KidInput = {
      name: form.name.trim(),
      classLabel: form.classLabel.trim(),
      gender: form.gender,
      ageYears: parsedAgeYears,
      ageDisplay: form.ageDisplay.trim(),
      heightCm,
      weightKg,
      status: form.status,
      alergi: form.alergi.trim() || "-",
    };

    // Simpan ke server dulu; data lokal hanya diubah bila server menerima
    // (atau server offline -> mode demo lokal).
    setSaving(true);
    const res = editingKid
      ? await SmartGrowthAPI.updateKid(editingKid.id, kidData)
      : await SmartGrowthAPI.addKid(kidData);
    setSaving(false);

    if (!res.ok && res.status !== 0) {
      setErrors(res.errors as FieldErrors<KidFields>);
      setServerError(hasErrors(res.errors) ? "" : res.message);
      return;
    }

    const saved: Kid | null = res.ok ? res.data.data : null;
    if (editingKid) {
      if (saved) {
        useAppStore.setState((s) => ({ kids: s.kids.map((k) => (k.id === editingKid.id ? saved : k)) }));
      } else {
        updateKid(editingKid.id, kidData);
      }
      notify("Data Diperbarui", `Data ${kidData.name} berhasil diperbarui${saved ? "" : " (mode offline)"}`);
    } else {
      if (saved) {
        useAppStore.setState((s) => ({ kids: [saved, ...s.kids] }));
      } else {
        addKid(kidData);
      }
      notify("Data Ditambahkan", `Data anak ${kidData.name} berhasil ditambahkan${saved ? "" : " (mode offline)"}`);
    }

    closeForm();
  };

  return (
    <>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A0A0A]">Data Anak</h1>
          <p className="text-sm text-[#4A5565]">
            Kelola data anak termasuk informasi fisik dan alergi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              resetKidsData();
              notify("Data Direset", "Data anak disesuaikan kembali dengan sampel Figma");
            }}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 text-xs font-medium text-[#4A5565] shadow-xs transition hover:bg-slate-50 hover:text-[#0A0A0A]"
            title="Kembalikan data anak ke sampel Figma"
          >
            <span>Reset Sampel Figma</span>
          </button>
          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0891B2] px-4 text-sm font-semibold text-white shadow-xs transition hover:bg-[#0E7490]"
          >
            <IconPlus size={16} stroke={2.5} />
            <span>Tambah Data Anak</span>
          </button>
        </div>
      </div>

      <section className="flex flex-col gap-6 rounded-[14px] border border-black/10 bg-white p-4 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-semibold text-[#0A0A0A]">Daftar Anak</h2>
            <p className="text-sm text-[#717182]">Total {kids.length} anak terdaftar</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="relative">
              <IconSearch
                size={18}
                stroke={1.67}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#99A1AF]"
              />
              <input
                type="search"
                maxLength={100}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari nama"
                aria-label="Cari nama anak"
                className="h-10 w-64 rounded-lg bg-[#F3F3F5] pr-3 pl-9 text-sm text-[#0A0A0A] outline-none placeholder:text-[#717182] focus:ring-2 focus:ring-[#0891B2]/40"
              />
            </label>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-black/10">
          <table className="w-full min-w-[820px] border-collapse text-left text-sm">
            <thead className="border-b border-black/10 bg-white text-xs font-semibold text-[#0A0A0A]">
              <tr>
                <th className="px-4 py-3.5 font-semibold">Nama</th>
                <th className="px-4 py-3.5 font-semibold">Kelas</th>
                <th className="px-4 py-3.5 font-semibold">Jenis Kelamin</th>
                <th className="px-4 py-3.5 font-semibold">Usia</th>
                <th className="px-4 py-3.5 font-semibold">TB (cm)</th>
                <th className="px-4 py-3.5 font-semibold">BB (kg)</th>
                <th className="px-4 py-3.5 font-semibold">Status Gizi</th>
                <th className="px-4 py-3.5 font-semibold">Alergi</th>
                <th className="px-4 py-3.5 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 bg-white">
              {filteredKids.map((kid) => {
                const cleanAllergy = (kid.alergi || "").trim();
                const hasAllergy = Boolean(
                  cleanAllergy &&
                    cleanAllergy !== "-" &&
                    cleanAllergy.toLowerCase() !== "tidak ada" &&
                    cleanAllergy.toLowerCase() !== "none",
                );
                const allergyCount = hasAllergy
                  ? cleanAllergy.split(/[,/]/).filter(Boolean).length || 1
                  : 0;

                return (
                  <tr key={kid.id} className="hover:bg-[#F9FAFB]/80 transition-colors">
                    <td className="px-4 py-3.5 font-medium text-[#0A0A0A]">{kid.name}</td>
                    <td className="px-4 py-3.5 text-[#4A5565]">{kid.classLabel}</td>
                    <td className="px-4 py-3.5 text-[#4A5565]">{kid.gender}</td>
                    <td className="px-4 py-3.5 text-[#4A5565]">
                      {kid.ageDisplay || `${kid.ageYears}th`}
                    </td>
                    <td className="px-4 py-3.5 text-[#4A5565]">{kid.heightCm}</td>
                    <td className="px-4 py-3.5 text-[#4A5565]">{kid.weightKg}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${
                          STATUS_BADGE_CLASSES[kid.status] || "bg-[#008A2E] text-white"
                        }`}
                      >
                        {kid.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {hasAllergy ? (
                        <div
                          title={`Alergi: ${kid.alergi}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#D4183D] px-2.5 py-0.5 text-xs font-semibold text-white shadow-xs cursor-help"
                        >
                          <IconAlertTriangle size={12} stroke={2.5} className="shrink-0" />
                          <span>{allergyCount} alergi</span>
                        </div>
                      ) : (
                        <span className="text-sm text-[#717182] pl-2 font-normal">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditForm(kid)}
                          aria-label={`Edit ${kid.name}`}
                          className="flex size-8 items-center justify-center rounded-lg text-[#4A5565] hover:bg-slate-100 hover:text-[#0A0A0A] transition-colors"
                        >
                          <IconEdit size={16} stroke={1.75} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(kid.id)}
                          aria-label={`Hapus data ${kid.name}`}
                          className="flex size-8 items-center justify-center rounded-lg text-[#E7000B] hover:bg-[#FFE2E2] transition-colors"
                        >
                          <IconTrash size={16} stroke={1.75} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredKids.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-[#717182]">
                    Tidak ada data anak yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {showForm ? (
        <Modal
          title={editingKid ? "Edit Data Anak" : "Tambah Data Anak"}
          description="Isi data anak dan informasi alergi sesuai hasil pengukuran terbaru"
          onClose={closeForm}
        >
          <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-xs font-bold text-[#1E1E1E]">Nama Lengkap</span>
              <input
                className={inputClass}
                {...fieldProps("kid-name", errors.name)}
                maxLength={100}
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Contoh: Ahmad Ridwan"
              />
              <FieldError id="kid-name-error" message={errors.name} />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-[#1E1E1E]">Kelas</span>
              <input
                className={inputClass}
                {...fieldProps("kid-class", errors.classLabel)}
                maxLength={20}
                value={form.classLabel}
                onChange={(event) => updateField("classLabel", event.target.value)}
                placeholder="Contoh: TK A1"
              />
              <FieldError id="kid-class-error" message={errors.classLabel} />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-[#1E1E1E]">Jenis Kelamin</span>
              <select
                className={inputClass}
                {...fieldProps("kid-gender", errors.gender)}
                value={form.gender}
                onChange={(event) => updateField("gender", event.target.value as Gender)}
              >
                {GENDERS.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-[#1E1E1E]">Usia</span>
              <input
                className={inputClass}
                {...fieldProps("kid-age", errors.ageDisplay)}
                maxLength={12}
                value={form.ageDisplay}
                onChange={(event) => updateField("ageDisplay", event.target.value)}
                placeholder="Contoh: 5th 8bln"
              />
              <FieldError id="kid-age-error" message={errors.ageDisplay} />
            </label>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1E1E1E]">Alergi Makanan</span>
                <span className="text-[11px] text-[#717182]">Ketik nama alergi atau pilih cepat:</span>
              </div>
              <input
                className={inputClass}
                {...fieldProps("kid-alergi", errors.alergi)}
                maxLength={200}
                value={form.alergi}
                onChange={(event) => updateField("alergi", event.target.value)}
                placeholder="Contoh: Telur, Kacang, Susu Sapi, atau '-' jika tidak ada"
              />
              <FieldError id="kid-alergi-error" message={errors.alergi} />
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {[
                  { label: "Tidak Ada (-)", val: "-" },
                  { label: "Telur", val: "Telur" },
                  { label: "Kacang", val: "Kacang" },
                  { label: "Susu Sapi", val: "Susu Sapi" },
                  { label: "Seafood", val: "Seafood" },
                  { label: "Ikan", val: "Ikan" },
                  { label: "Gluten", val: "Gluten" },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      if (item.val === "-") {
                        updateField("alergi", "-");
                      } else {
                        const cur = form.alergi.trim();
                        if (!cur || cur === "-") {
                          updateField("alergi", item.val);
                        } else if (!cur.toLowerCase().includes(item.val.toLowerCase())) {
                          updateField("alergi", `${cur}, ${item.val}`);
                        }
                      }
                    }}
                    className="rounded-md border border-black/10 bg-[#F4F5F7] px-2 py-0.5 text-xs text-[#4A5565] hover:bg-[#E5E7EB] hover:text-[#0A0A0A] transition-colors"
                  >
                    + {item.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-[#1E1E1E]">TB (cm)</span>
              <input
                className={inputClass}
                type="number"
                inputMode="decimal"
                min="60"
                max="160"
                step="0.1"
                {...fieldProps("kid-height", errors.heightCm)}
                value={form.heightCm}
                onChange={(event) => updateField("heightCm", event.target.value)}
                placeholder="Tinggi badan (cm)"
              />
              <FieldError id="kid-height-error" message={errors.heightCm} />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-[#1E1E1E]">BB (kg)</span>
              <input
                className={inputClass}
                type="number"
                inputMode="decimal"
                min="5"
                max="80"
                step="0.1"
                {...fieldProps("kid-weight", errors.weightKg)}
                value={form.weightKg}
                onChange={(event) => updateField("weightKg", event.target.value)}
                placeholder="Berat badan (kg)"
              />
              <FieldError id="kid-weight-error" message={errors.weightKg} />
            </label>

            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-xs font-bold text-[#1E1E1E]">Status Gizi</span>
              <select
                className={inputClass}
                {...fieldProps("kid-status", errors.status)}
                value={form.status}
                onChange={(event) => updateField("status", event.target.value as NutritionStatus)}
              >
                {NUTRITION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            {hasErrors(errors) ? (
              <p role="alert" className="text-sm font-medium text-[#E7000B] sm:col-span-2">
                Periksa kembali isian yang ditandai merah.
              </p>
            ) : null}
            {serverError ? (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-[#D4183D] sm:col-span-2">
                {serverError}
              </p>
            ) : null}

            <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
              <button
                type="button"
                onClick={closeForm}
                className="h-9 rounded-lg border border-black/10 bg-white px-4 text-sm font-medium text-[#0A0A0A] hover:bg-black/5"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-9 rounded-lg bg-[#0891B2] px-4 text-sm font-medium text-white hover:bg-[#0E7490] disabled:opacity-70"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          title="Konfirmasi Hapus"
          message={`Apakah Anda yakin ingin menghapus data ${pendingDelete.name}?`}
          confirmLabel="Hapus"
          onCancel={() => setPendingDeleteId(null)}
          onConfirm={() => {
            deleteKid(pendingDelete.id);
            SmartGrowthAPI.deleteKid(pendingDelete.id).catch(() => {});
            notify("Data Dihapus", `Data anak ${pendingDelete.name} berhasil dihapus`);
            setPendingDeleteId(null);
          }}
        />
      ) : null}
    </>
  );
}
