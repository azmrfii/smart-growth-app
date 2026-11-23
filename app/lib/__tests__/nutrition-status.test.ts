// Tes perhitungan status gizi otomatis
import { describe, expect, it } from "vitest";

import {
  ageDisplayToMonths,
  calculateStatusGizi,
  checkStandard,
  DEFAULT_WHO_TABLE,
  determineStatus,
  hitungZScore,
} from "../nutrition-status";

describe("ageDisplayToMonths", () => {
  it("mengubah teks usia ke bulan", () => {
    expect(ageDisplayToMonths("5th 8bln")).toBe(68);
    expect(ageDisplayToMonths("3th")).toBe(36);
    expect(ageDisplayToMonths("abc")).toBe(0);
  });
});

describe("determineStatus (batas Z-Score DPPL)", () => {
  it.each([
    [-3.01, "Gizi Buruk"],
    [-3, "Gizi Kurang"],
    [-2.01, "Gizi Kurang"],
    [-2, "Gizi Baik"],
    [2, "Gizi Baik"],
    [2.01, "Gizi Lebih"],
    [3, "Gizi Lebih"],
    [3.01, "Obesitas"],
  ])("Z=%s -> %s", (z, expected) => {
    expect(determineStatus(z)).toBe(expected);
  });
});

describe("calculateStatusGizi", () => {
  it("memakai baris WHO usia terdekat (<=) sesuai jenis kelamin", () => {
    expect(checkStandard(DEFAULT_WHO_TABLE, "Laki-laki", 68)?.usia_bulan).toBe(60);
    expect(checkStandard(DEFAULT_WHO_TABLE, "Perempuan", 36)?.mean_tinggi).toBe(95.1);
  });

  it("hitung Z-Score = (TB - mean) / SD", () => {
    expect(hitungZScore(98, 110, 4.3)).toBeCloseTo(-2.79, 2);
  });

  it("Farhan Maulana (L, 5th 9bln, 98 cm) -> Gizi Kurang", () => {
    const r = calculateStatusGizi({ gender: "Laki-laki", ageDisplay: "5th 9bln", heightCm: 98, weightKg: 13.2 });
    expect(r.zScore).toBe(-2.79);
    expect(r.status).toBe("Gizi Kurang");
    expect(r.bmi).toBe(13.7);
  });

  it("anak jauh di bawah standar -> Gizi Buruk, jauh di atas -> Obesitas", () => {
    expect(calculateStatusGizi({ gender: "Laki-laki", ageDisplay: "5th 0bln", heightCm: 95, weightKg: 11 }).status).toBe("Gizi Buruk");
    expect(calculateStatusGizi({ gender: "Laki-laki", ageDisplay: "5th 0bln", heightCm: 125, weightKg: 30 }).status).toBe("Obesitas");
  });

  it("memakai tabel kustom (hasil edit Ahli Gizi)", () => {
    const rows = DEFAULT_WHO_TABLE.map((r) => (r.usia_bulan === 60 && r.jenis_kelamin === "Laki-laki" ? { ...r, mean_tinggi: 98 } : r));
    expect(calculateStatusGizi({ gender: "Laki-laki", ageDisplay: "5th 0bln", heightCm: 98, weightKg: 15 }, rows).status).toBe("Gizi Baik");
  });
});
