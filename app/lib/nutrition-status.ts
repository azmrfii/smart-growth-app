export const NUTRITION_STATUSES = [
  "Gizi Buruk",
  "Gizi Kurang",
  "Gizi Baik",
  "Berisiko Gizi Lebih",
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
  "Berisiko Gizi Lebih": {
    card: "border-[#FFD6A7] bg-linear-to-br from-[#FFF7ED] to-[#FFEDD4]",
    badge: "bg-[#FFEDD4] text-[#CA3500]",
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
    zScore: "-2 SD sampai +1 SD",
    description: "Status gizi normal",
  },
  {
    status: "Berisiko Gizi Lebih",
    zScore: "Lebih dari +1 SD sampai +2 SD",
    description: "Berisiko kelebihan berat badan",
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
