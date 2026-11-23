export const NUTRITION_STATUSES = [
  "Gizi Buruk",
  "Gizi Kurang",
  "Gizi Baik",
  "Gizi Lebih",
  "Obesitas",
] as const;

export type NutritionStatus = (typeof NUTRITION_STATUSES)[number];

export const NUTRITION_STATUS_STYLES: Record<
  NutritionStatus,
  { card: string; badge: string }
> = {
  "Gizi Buruk": {
    card: "border-[#CAD5E2] bg-linear-to-br from-[#F1F5F9] to-[#E2E8F0]",
    badge: "bg-[#FFE2E2] text-[#C10007]",
  },
  "Gizi Kurang": {
    card: "border-[#FFD230] bg-linear-to-br from-[#FEF3C6] to-[#FEE685]",
    badge: "bg-[#FEF3C6] text-[#BB4D00]",
  },
  "Gizi Baik": {
    card: "border-[#7BF1A8] bg-linear-to-br from-[#DCFCE7] to-[#B9F8CF]",
    badge: "bg-[#DCFCE7] text-[#016630]",
  },
  "Gizi Lebih": {
    card: "border-[#FFB86A] bg-linear-to-br from-[#FFF4E5] to-[#FFD6A8]",
    badge: "bg-[#FFD6A8] text-[#9F2D00]",
  },
  Obesitas: {
    card: "border-[#FFA2A2] bg-linear-to-br from-[#FEF2F2] to-[#FFE2E2]",
    badge: "bg-[#FFE2E2] text-[#82181A]",
  },
};

export const NUTRITION_STANDARDS: {
  status: NutritionStatus;
  zScore: string;
  description: string;
}[] = [
  {
    status: "Gizi Buruk",
    zScore: "Kurang dari -3 SD",
    description: "Kekurangan gizi berat",
  },
  {
    status: "Gizi Kurang",
    zScore: "-3 SD sampai kurang dari -2 SD",
    description: "Kekurangan gizi sedang",
  },
  {
    status: "Gizi Baik",
    zScore: "-2 SD sampai +2 SD",
    description: "Status gizi normal",
  },
  {
    status: "Gizi Lebih",
    zScore: "Lebih dari +2 SD sampai +3 SD",
    description: "Kelebihan berat badan",
  },
  {
    status: "Obesitas",
    zScore: "Lebih dari +3 SD",
    description: "Kelebihan berat badan berat",
  },
];

export type WhoStandardRow = {
  id_standar?: number;
  usia_bulan: number;
  usia_tahun: number;
  jenis_kelamin: string;
  mean_tinggi: number;
  sd_tinggi: number;
};

export const DEFAULT_WHO_TABLE: WhoStandardRow[] = [
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

/** "5th 8bln" / "5th" / "5" -> total bulan (5*12+8 = 68). */
export function ageDisplayToMonths(ageDisplay: string): number {
  const m = /^\s*(\d{1,2})\s*(?:th|thn|tahun)?(?:\s*(\d{1,2})\s*(?:bln|bulan))?\s*$/i.exec(ageDisplay || "");
  if (!m) return 0;
  return Number(m[1]) * 12 + Number(m[2] ?? 0);
}

export function checkStandard(
  rows: WhoStandardRow[],
  gender: string,
  ageMonths: number,
): WhoStandardRow | undefined {
  const sameGender = rows.filter((r) => r.jenis_kelamin === gender);
  const matched = sameGender
    .filter((r) => r.usia_bulan <= ageMonths)
    .sort((a, b) => b.usia_bulan - a.usia_bulan)[0];
  return matched ?? sameGender[0];
}

/** Z = (TB - Median) / SD. SD <= 0 dianggap tidak valid -> Z = 0. */
export function hitungZScore(heightCm: number, mean: number, sd: number): number {
  return sd > 0 ? (heightCm - mean) / sd : 0;
}

export function determineStatus(zScore: number): NutritionStatus {
  if (zScore < -3) return "Gizi Buruk";
  if (zScore < -2) return "Gizi Kurang";
  if (zScore <= 2) return "Gizi Baik";
  if (zScore <= 3) return "Gizi Lebih";
  return "Obesitas";
}

export const STATUS_INTERPRETATION: Record<NutritionStatus, string> = {
  "Gizi Buruk": "Z-Score < -3: Gizi Buruk (Severely Malnourished). Butuh penanganan khusus segera.",
  "Gizi Kurang": "-3 SD <= Z-Score < -2 SD: Gizi Kurang (Undernourished). Perlu intervensi asupan tinggi protein.",
  "Gizi Baik": "-2 SD <= Z-Score <= +2 SD: Gizi Baik (Normal). Pertahankan pola gizi seimbang.",
  "Gizi Lebih": "+2 SD < Z-Score <= +3 SD: Gizi Lebih (Overweight). Perlu kontrol asupan gula dan karbohidrat.",
  Obesitas: "Z-Score > +3 SD: Obesitas (Obese). Perlu penyesuaian porsi kalori dan aktivitas fisik.",
};

export type StatusGiziResult = {
  zScore: number;
  status: NutritionStatus;
  bmi: number;
  interpretation: string;
  medianHeight: number;
  standardDeviation: number;
};

/** calculateStatusGizi(Anak): gabungan checkStandard + hitungZScore + determineStatus + BMI. */
export function calculateStatusGizi(
  input: { gender: string; ageDisplay: string; heightCm: number; weightKg: number },
  rows: WhoStandardRow[] = DEFAULT_WHO_TABLE,
): StatusGiziResult {
  const std = checkStandard(rows, input.gender, ageDisplayToMonths(input.ageDisplay));
  const mean = std?.mean_tinggi ?? 110;
  const sd = std?.sd_tinggi ?? 4.5;
  const zScore = hitungZScore(input.heightCm, mean, sd);
  const status = determineStatus(zScore);
  const heightM = input.heightCm / 100;
  const bmi = heightM > 0 ? Math.round((input.weightKg / heightM ** 2) * 10) / 10 : 0;
  return {
    zScore: Math.round(zScore * 100) / 100,
    status,
    bmi,
    interpretation: STATUS_INTERPRETATION[status],
    medianHeight: mean,
    standardDeviation: sd,
  };
}
