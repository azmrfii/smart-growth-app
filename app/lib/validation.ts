/**
 * Validasi data masukan form (Smart Growth).
 *
 * Semua fungsi bersifat murni (tanpa efek samping) sehingga mudah diuji.
 * Setiap validator mengembalikan objek { field: pesanError }; objek kosong
 * berarti seluruh data valid. Aturan sengaja diselaraskan dengan validasi
 * backend Laravel (lihat smart-growth-api/app/Http/Controllers/Api).
 */

export type FieldErrors<K extends string = string> = Partial<Record<K, string>>;

export const hasErrors = (errors: object) => Object.keys(errors).length > 0;

// ---------------------------------------------------------------- batas nilai
export const LIMITS = {
  name: { min: 3, max: 100 },
  username: { min: 5, max: 30 },
  password: { min: 8, max: 72 }, // 72 = batas byte bcrypt
  email: { max: 254 },
  kelas: { min: 2, max: 20 },
  alergi: { max: 200 },
  // Standar WHO pada sistem ini mencakup anak usia 3-7 tahun.
  ageYears: { min: 3, max: 7 },
  heightCm: { min: 60, max: 160 },
  weightKg: { min: 5, max: 80 },
  foodName: { min: 2, max: 50 },
  calories: { max: 2000 },
  macro: { max: 500 },
} as const;

// -------------------------------------------------------------------- pola
// Huruf (termasuk aksen), spasi, titik, apostrof, tanda hubung. Tanpa angka.
const PERSON_NAME_RE = /^[\p{L}][\p{L} .'-]*$/u;
const USERNAME_RE = /^[a-z0-9._]+$/;
const KELAS_RE = /^[A-Za-z0-9][A-Za-z0-9 ]*$/;
const ALLERGY_RE = /^[\p{L}0-9 ,/()-]+$/u;
// Praktis & cukup ketat: local@domain.tld, tanpa spasi, tanpa titik berurutan.
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
const OTP_RE = /^\d{6}$/;

const collapse = (value: string) => value.trim().replace(/\s+/g, " ");

// ------------------------------------------------------------ parser angka
/** Mengubah teks isian menjadi angka; "" / "abc" / "1e3" / "Infinity" -> null. */
export function parseNumber(raw: string): number | null {
  const text = raw.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

/**
 * Membaca usia dari teks seperti "5th 8bln", "5 th", atau "5".
 * Mengembalikan null bila format tidak dikenali.
 */
export function parseAge(raw: string): { years: number; months: number } | null {
  const text = raw.trim().toLowerCase();
  const match = text.match(/^(\d{1,2})\s*(?:th|thn|tahun)?(?:\s*(\d{1,2})\s*(?:bln|bulan))?$/);
  if (!match) return null;
  return { years: Number(match[1]), months: match[2] ? Number(match[2]) : 0 };
}

// --------------------------------------------------------- validator dasar
export function validateEmail(email: string): string | undefined {
  const value = email.trim();
  if (!value) return "Email wajib diisi.";
  if (value.length > LIMITS.email.max) return "Email terlalu panjang.";
  if (!EMAIL_RE.test(value) || value.includes("..")) {
    return "Format email tidak valid (contoh: nama@domain.com).";
  }
  return undefined;
}

export function validatePersonName(name: string, label = "Nama lengkap"): string | undefined {
  const value = collapse(name);
  if (!value) return `${label} wajib diisi.`;
  if (value.length < LIMITS.name.min) return `${label} minimal ${LIMITS.name.min} karakter.`;
  if (value.length > LIMITS.name.max) return `${label} maksimal ${LIMITS.name.max} karakter.`;
  if (!PERSON_NAME_RE.test(value)) {
    return `${label} hanya boleh berisi huruf, spasi, titik, apostrof, dan tanda hubung.`;
  }
  return undefined;
}

export function validateUsername(
  username: string,
  existing: string[] = [],
): string | undefined {
  const value = username.trim();
  if (!value) return "Username wajib diisi.";
  if (/\s/.test(value)) return "Username tidak boleh mengandung spasi.";
  if (value.length < LIMITS.username.min) return `Username minimal ${LIMITS.username.min} karakter.`;
  if (value.length > LIMITS.username.max) return `Username maksimal ${LIMITS.username.max} karakter.`;
  if (!USERNAME_RE.test(value)) {
    return "Username hanya boleh huruf kecil, angka, titik (.), dan garis bawah (_).";
  }
  if (existing.some((u) => u.toLowerCase() === value.toLowerCase())) {
    return "Username sudah digunakan oleh akun lain.";
  }
  return undefined;
}

/** Aturan password untuk akun BARU / password yang diganti. */
export function validateNewPassword(password: string): string | undefined {
  if (!password) return "Password wajib diisi.";
  if (/\s/.test(password)) return "Password tidak boleh mengandung spasi.";
  if (password.length < LIMITS.password.min) return `Password minimal ${LIMITS.password.min} karakter.`;
  if (password.length > LIMITS.password.max) return `Password maksimal ${LIMITS.password.max} karakter.`;
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password harus mengandung minimal satu huruf dan satu angka.";
  }
  return undefined;
}

export function validateOtp(code: string): string | undefined {
  const value = code.trim();
  if (!value) return "Kode OTP wajib diisi.";
  if (!OTP_RE.test(value)) return "Kode OTP harus berupa 6 digit angka.";
  return undefined;
}

// ------------------------------------------------------------------- Login
export type LoginFields = "username" | "password";

export function validateLoginForm(input: { username: string; password: string }) {
  const errors: FieldErrors<LoginFields> = {};
  const username = input.username.trim();
  if (!username) errors.username = "Username wajib diisi.";
  else if (/\s/.test(username)) errors.username = "Username tidak boleh mengandung spasi.";
  else if (username.length > LIMITS.username.max) {
    errors.username = `Username maksimal ${LIMITS.username.max} karakter.`;
  }
  if (!input.password) errors.password = "Password wajib diisi.";
  else if (input.password.length > LIMITS.password.max) {
    errors.password = `Password maksimal ${LIMITS.password.max} karakter.`;
  }
  return errors;
}

// -------------------------------------------------------------- Data Anak
export type KidFields =
  | "name"
  | "classLabel"
  | "gender"
  | "ageDisplay"
  | "heightCm"
  | "weightKg"
  | "alergi"
  | "status";

export type KidFormInput = {
  name: string;
  classLabel: string;
  gender: string;
  ageDisplay: string;
  heightCm: string;
  weightKg: string;
  alergi: string;
  status: string;
};

export function validateKidForm(
  input: KidFormInput,
  allowed: { genders: readonly string[]; statuses: readonly string[] },
): FieldErrors<KidFields> {
  const errors: FieldErrors<KidFields> = {};

  const nameError = validatePersonName(input.name, "Nama anak");
  if (nameError) errors.name = nameError;

  const kelas = collapse(input.classLabel);
  if (!kelas) errors.classLabel = "Kelas wajib diisi.";
  else if (kelas.length < LIMITS.kelas.min || kelas.length > LIMITS.kelas.max) {
    errors.classLabel = `Kelas harus ${LIMITS.kelas.min}-${LIMITS.kelas.max} karakter.`;
  } else if (!KELAS_RE.test(kelas)) {
    errors.classLabel = "Kelas hanya boleh huruf, angka, dan spasi (contoh: TK A1).";
  }

  if (!allowed.genders.includes(input.gender)) errors.gender = "Pilih jenis kelamin yang valid.";
  if (!allowed.statuses.includes(input.status)) errors.status = "Pilih status gizi yang valid.";

  if (!input.ageDisplay.trim()) {
    errors.ageDisplay = "Usia wajib diisi.";
  } else {
    const age = parseAge(input.ageDisplay);
    if (!age) {
      errors.ageDisplay = "Format usia tidak valid. Gunakan contoh: 5th 8bln atau 5.";
    } else if (age.months > 11) {
      errors.ageDisplay = "Jumlah bulan harus antara 0 sampai 11.";
    } else if (age.years < LIMITS.ageYears.min || age.years > LIMITS.ageYears.max) {
      errors.ageDisplay = `Usia harus antara ${LIMITS.ageYears.min} dan ${LIMITS.ageYears.max} tahun (cakupan standar WHO).`;
    }
  }

  const height = parseNumber(input.heightCm);
  if (!input.heightCm.trim()) errors.heightCm = "Tinggi badan wajib diisi.";
  else if (height === null) errors.heightCm = "Tinggi badan harus berupa angka.";
  else if (height < LIMITS.heightCm.min || height > LIMITS.heightCm.max) {
    errors.heightCm = `Tinggi badan harus antara ${LIMITS.heightCm.min} dan ${LIMITS.heightCm.max} cm.`;
  }

  const weight = parseNumber(input.weightKg);
  if (!input.weightKg.trim()) errors.weightKg = "Berat badan wajib diisi.";
  else if (weight === null) errors.weightKg = "Berat badan harus berupa angka.";
  else if (weight < LIMITS.weightKg.min || weight > LIMITS.weightKg.max) {
    errors.weightKg = `Berat badan harus antara ${LIMITS.weightKg.min} dan ${LIMITS.weightKg.max} kg.`;
  }

  const alergi = input.alergi.trim();
  if (!alergi) {
    errors.alergi = "Isi alergi, atau tulis '-' jika tidak ada.";
  } else if (alergi.length > LIMITS.alergi.max) {
    errors.alergi = `Alergi maksimal ${LIMITS.alergi.max} karakter.`;
  } else if (alergi !== "-" && !ALLERGY_RE.test(alergi)) {
    errors.alergi = "Alergi hanya boleh huruf, angka, koma, garis miring, dan tanda kurung.";
  }

  return errors;
}

// ------------------------------------------------------- Kelola Pengguna
export type UserFields = "name" | "username" | "email" | "password" | "role";

export function validateUserForm(
  input: { name: string; username: string; email: string; password: string; role: string },
  opts: {
    roles: readonly string[];
    existingUsernames: string[];
    existingEmails?: string[];
    /** true saat edit: password boleh kosong (tidak diubah). */
    isEdit: boolean;
  },
): FieldErrors<UserFields> {
  const errors: FieldErrors<UserFields> = {};

  const nameError = validatePersonName(input.name);
  if (nameError) errors.name = nameError;

  const usernameError = validateUsername(input.username, opts.existingUsernames);
  if (usernameError) errors.username = usernameError;

  const emailError = validateEmail(input.email);
  if (emailError) errors.email = emailError;
  else if (
    (opts.existingEmails ?? []).some((e) => e.toLowerCase() === input.email.trim().toLowerCase())
  ) {
    errors.email = "Email sudah digunakan oleh akun lain.";
  }

  if (!(opts.isEdit && input.password === "")) {
    const passwordError = validateNewPassword(input.password);
    if (passwordError) errors.password = passwordError;
  }

  if (!opts.roles.includes(input.role)) errors.role = "Pilih peran yang valid.";

  return errors;
}

// ------------------------------------------------------------- Bahan Menu
export type FoodFields = "name" | "calories" | "protein" | "carbs" | "fat";

export function validateFoodForm(
  input: { name: string; calories: string; protein: string; carbs: string; fat: string },
  existingNames: string[] = [],
): FieldErrors<FoodFields> {
  const errors: FieldErrors<FoodFields> = {};

  const name = collapse(input.name);
  if (!name) errors.name = "Nama makanan wajib diisi.";
  else if (name.length < LIMITS.foodName.min || name.length > LIMITS.foodName.max) {
    errors.name = `Nama makanan harus ${LIMITS.foodName.min}-${LIMITS.foodName.max} karakter.`;
  } else if (!/^[\p{L}][\p{L}0-9 ().,'-]*$/u.test(name)) {
    errors.name = "Nama makanan harus diawali huruf dan tidak boleh berisi simbol khusus.";
  } else if (existingNames.some((n) => n.trim().toLowerCase() === name.toLowerCase())) {
    errors.name = "Bahan dengan nama ini sudah ada di database.";
  }

  const numeric: Array<[FoodFields, string, string, number]> = [
    ["calories", input.calories, "Kalori", LIMITS.calories.max],
    ["protein", input.protein, "Protein", LIMITS.macro.max],
    ["carbs", input.carbs, "Karbohidrat", LIMITS.macro.max],
    ["fat", input.fat, "Lemak", LIMITS.macro.max],
  ];
  for (const [key, raw, label, max] of numeric) {
    const value = parseNumber(raw);
    if (!raw.trim()) errors[key] = `${label} wajib diisi.`;
    else if (value === null) errors[key] = `${label} harus berupa angka tidak negatif.`;
    else if (value > max) errors[key] = `${label} maksimal ${max}.`;
  }

  return errors;
}
