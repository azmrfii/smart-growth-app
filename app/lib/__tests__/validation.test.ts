import { describe, expect, it } from "vitest";

import {
  parseAge,
  parseNumber,
  validateEmail,
  validateFoodForm,
  validateKidForm,
  validateLoginForm,
  validateNewPassword,
  validateOtp,
  validateUserForm,
  validateUsername,
} from "../validation";

const ALLOWED = { genders: ["Laki-laki", "Perempuan"], statuses: ["Gizi Baik", "Gizi Kurang"] };
const ROLES = ["Super Admin", "Tata Usaha", "Admin dapur MBG", "Ahli Gizi"];

const kid = (o: Record<string, string> = {}) => ({
  name: "Ahmad Ridwan",
  classLabel: "TK A1",
  gender: "Laki-laki",
  ageDisplay: "5th 8bln",
  heightCm: "105",
  weightKg: "17.5",
  alergi: "Telur, Kacang",
  status: "Gizi Baik",
  ...o,
});

const user = (o: Record<string, string> = {}) => ({
  name: "Andi Wijaya",
  username: "andi_w",
  email: "andi@example.com",
  password: "Rahasia123",
  role: "Tata Usaha",
  ...o,
});

describe("parser", () => {
  it.each([
    ["105", 105],
    ["17,5", 17.5],
    [" 3.25 ", 3.25],
    ["", null],
    ["abc", null],
    ["-5", null],
    ["1e3", null],
    ["Infinity", null],
  ])("parseNumber(%j) -> %j", (raw, expected) => expect(parseNumber(raw)).toBe(expected));

  it.each([
    ["5th 8bln", { years: 5, months: 8 }],
    ["5", { years: 5, months: 0 }],
    ["4 tahun 3 bulan", { years: 4, months: 3 }],
    ["lima tahun", null],
    ["5th8", null],
  ])("parseAge(%j)", (raw, expected) => expect(parseAge(raw)).toEqual(expected));
});

describe("email & OTP", () => {
  it.each(["andi@example.com", "a.b+tag@sub.domain.co.id"])("email valid: %s", (e) =>
    expect(validateEmail(e)).toBeUndefined(),
  );
  it.each(["", "andi", "andi@", "@x.com", "andi@x", "an di@x.com", "a..b@x.com", "andi@x.c"])(
    "email tidak valid: %j",
    (e) => expect(validateEmail(e)).toBeDefined(),
  );
  it("OTP harus 6 digit", () => {
    expect(validateOtp("123456")).toBeUndefined();
    for (const bad of ["", "12345", "1234567", "12a456", "12 456"]) expect(validateOtp(bad)).toBeDefined();
  });
});

describe("login", () => {
  it("wajib isi username & password", () => {
    expect(validateLoginForm({ username: "", password: "" })).toEqual({
      username: expect.any(String),
      password: expect.any(String),
    });
    expect(validateLoginForm({ username: "siti_aminah", password: "x" })).toEqual({});
    expect(validateLoginForm({ username: "siti aminah", password: "x" }).username).toMatch(/spasi/);
  });
});

describe("pengguna", () => {
  it("data valid lolos", () => {
    expect(validateUserForm(user(), { roles: ROLES, existingUsernames: [], isEdit: false })).toEqual({});
  });
  it.each([
    [{ name: "" }, "name"],
    [{ name: "Andi 2" }, "name"],
    [{ username: "andi" }, "username"],
    [{ username: "Andi_W" }, "username"],
    [{ username: "andi w" }, "username"],
    [{ email: "andi@" }, "email"],
    [{ password: "abc12" }, "password"],
    [{ password: "abcdefgh" }, "password"],
    [{ password: "12345678" }, "password"],
    [{ role: "Hacker" }, "role"],
  ])("menolak %j", (o, field) => {
    expect(validateUserForm(user(o), { roles: ROLES, existingUsernames: [], isEdit: false })).toHaveProperty(field);
  });
  it("menolak username/email duplikat (tanpa beda huruf besar-kecil)", () => {
    const errs = validateUserForm(user({ email: "SITI@smartgrowth.id", username: "siti_aminah" }), {
      roles: ROLES,
      existingUsernames: ["siti_aminah"],
      existingEmails: ["siti@smartgrowth.id"],
      isEdit: false,
    });
    expect(errs.username).toMatch(/sudah digunakan/);
    expect(errs.email).toMatch(/sudah digunakan/);
  });
  it("password boleh kosong saat edit", () => {
    expect(validateUserForm(user({ password: "" }), { roles: ROLES, existingUsernames: [], isEdit: true })).toEqual({});
    expect(validateNewPassword("")).toBeDefined();
  });
  it("username batas panjang", () => {
    expect(validateUsername("abcde")).toBeUndefined();
    expect(validateUsername("a".repeat(31))).toBeDefined();
  });
});

describe("data anak", () => {
  it("data valid lolos", () => expect(validateKidForm(kid(), ALLOWED)).toEqual({}));
  it("alergi '-' berarti tidak ada", () => expect(validateKidForm(kid({ alergi: "-" }), ALLOWED)).toEqual({}));
  it.each([
    [{ name: "" }, "name"],
    [{ name: "Ahmad99" }, "name"],
    [{ classLabel: "" }, "classLabel"],
    [{ classLabel: "TK<A1>" }, "classLabel"],
    [{ gender: "X" }, "gender"],
    [{ status: "Super" }, "status"],
    [{ ageDisplay: "" }, "ageDisplay"],
    [{ ageDisplay: "lima" }, "ageDisplay"],
    [{ ageDisplay: "2th 0bln" }, "ageDisplay"],
    [{ ageDisplay: "8th" }, "ageDisplay"],
    [{ ageDisplay: "5th 12bln" }, "ageDisplay"],
    [{ heightCm: "" }, "heightCm"],
    [{ heightCm: "-1" }, "heightCm"],
    [{ heightCm: "59.9" }, "heightCm"],
    [{ heightCm: "161" }, "heightCm"],
    [{ weightKg: "0" }, "weightKg"],
    [{ weightKg: "abc" }, "weightKg"],
    [{ weightKg: "81" }, "weightKg"],
    [{ alergi: "" }, "alergi"],
    [{ alergi: "<script>" }, "alergi"],
  ])("menolak %j", (o, field) => expect(validateKidForm(kid(o), ALLOWED)).toHaveProperty(field));
  it("nilai batas diterima", () => {
    expect(validateKidForm(kid({ heightCm: "60", weightKg: "80", ageDisplay: "7th 11bln" }), ALLOWED)).toEqual({});
    expect(validateKidForm(kid({ heightCm: "160", weightKg: "5", ageDisplay: "3" }), ALLOWED)).toEqual({});
  });
});

describe("bahan menu", () => {
  const food = { name: "Tahu Kukus", calories: "80", protein: "8", carbs: "2", fat: "4.5" };
  it("data valid lolos", () => expect(validateFoodForm(food)).toEqual({}));
  it("nol diperbolehkan", () => expect(validateFoodForm({ ...food, carbs: "0" })).toEqual({}));
  it.each([
    [{ name: "" }, "name"],
    [{ name: "1Tahu" }, "name"],
    [{ calories: "" }, "calories"],
    [{ calories: "-1" }, "calories"],
    [{ calories: "2001" }, "calories"],
    [{ protein: "abc" }, "protein"],
    [{ fat: "501" }, "fat"],
  ])("menolak %j", (o, field) => expect(validateFoodForm({ ...food, ...o })).toHaveProperty(field));
  it("menolak nama duplikat", () =>
    expect(validateFoodForm({ ...food, name: "tahu  kukus" }, ["Tahu Kukus"]).name).toMatch(/sudah ada/));
});
