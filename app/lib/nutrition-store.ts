import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { type NutritionStatus } from "@/lib/nutrition-status";

export const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"] as const;
export type Day = (typeof DAYS)[number];
export type DayMenu = Record<Day, string[]>;

export const GENDERS = ["Laki-laki", "Perempuan"] as const;
export type Gender = (typeof GENDERS)[number];

export type Kid = {
  id: string;
  name: string;
  classLabel: string;
  gender: Gender;
  ageYears: number;
  ageDisplay: string;
  heightCm: number;
  weightKg: number;
  status: NutritionStatus;
  alergi: string;
};
export type KidInput = Omit<Kid, "id">;

export type Food = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};
export type FoodInput = Omit<Food, "id">;

export type MenuStatus = "draft" | "submitted";
export type WeeklyMenu = {
  id: string;
  title: string;
  status: MenuStatus;
  createdBy: string;
  createdAt: string;
  days: DayMenu;
};

export type Notice = { id: string; title: string; body: string };

export const createEmptyDayMenu = (): DayMenu => ({
  Senin: [],
  Selasa: [],
  Rabu: [],
  Kamis: [],
  Jumat: [],
  });

const createId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const getLocalDate = () => new Intl.DateTimeFormat("sv-SE").format(new Date());
const getLocalTime = () =>
  new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

const SEED_FOODS: Food[] = [
  { id: "food-dada-ayam", name: "Dada Ayam", calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { id: "food-nasi-putih", name: "Nasi Putih", calories: 195, protein: 4, carbs: 43, fat: 0.4 },
  { id: "food-brokoli", name: "Brokoli", calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  { id: "food-wortel", name: "Wortel", calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
  { id: "food-tempe-goreng", name: "Tempe Goreng", calories: 193, protein: 19, carbs: 9, fat: 11 },
  { id: "food-telur-rebus", name: "Telur Rebus", calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  { id: "food-ikan-salmon", name: "Ikan Salmon", calories: 208, protein: 20, carbs: 0, fat: 13 },
  { id: "food-pisang", name: "Pisang", calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
];

type SeedKid = [string, string, Gender, number, number, number, NutritionStatus, string, string];

const SEED_KIDS: SeedKid[] = [
  ["Ahmad Ridwan", "TK A1", "Laki-laki", 5, 95, 11.5, "Gizi Buruk", "Telur", "5th 8bln"],
  ["Siti Aisyah", "TK A1", "Perempuan", 5, 102, 15.5, "Gizi Baik", "-", "5th 6bln"],
  ["Budi Santoso", "TK A1", "Laki-laki", 5, 104, 19.5, "Gizi Lebih", "Kacang", "5th 10bln"],
  ["Dewi Lestari", "TK A1", "Perempuan", 5, 100, 15, "Gizi Baik", "-", "5th 4bln"],
  ["Farhan Maulana", "TK A1", "Laki-laki", 5, 98, 13.2, "Gizi Kurang", "Susu Sapi", "5th 9bln"],
  ["Zahra Amalia", "TK A1", "Perempuan", 5, 101, 16, "Gizi Baik", "-", "5th 2bln"],
  ["Rizki Pratama", "TK A1", "Laki-laki", 5, 103, 21, "Obesitas", "-", "5th 7bln"],
  ["Aisyah Putri", "TK A2", "Perempuan", 4, 102, 16.5, "Gizi Baik", "Kacang", "4th 6bln"],
  ["Bima Saputra", "TK B1", "Laki-laki", 5, 106, 13, "Gizi Buruk", "-", "5th 1bln"],
  ["Citra Lestari", "TK A2", "Perempuan", 3, 92, 10.8, "Gizi Buruk", "Susu Sapi", "3th 8bln"],
  ["Dimas Pratama", "TK B1", "Laki-laki", 6, 113, 15.9, "Gizi Kurang", "-", "6th 2bln"],
  ["Eka Wulandari", "TK A1", "Perempuan", 4, 99, 14, "Gizi Kurang", "Telur", "4th 5bln"],
  ["Fajar Nugroho", "TK B2", "Laki-laki", 5, 108, 15.2, "Gizi Kurang", "-", "5th 3bln"],
  ["Gita Anindya", "TK A2", "Perempuan", 3, 95, 12.6, "Gizi Kurang", "-", "3th 11bln"],
  ["Hafiz Ramadhan", "TK B1", "Laki-laki", 6, 116, 20.4, "Gizi Baik", "Udang", "6th 4bln"],
  ["Indah Permata", "TK A1", "Perempuan", 4, 101, 15.1, "Gizi Baik", "-", "4th 9bln"],
  ["Joni Kurniawan", "TK B2", "Laki-laki", 7, 121, 21, "Gizi Baik", "-", "7th 0bln"],
  ["Kirana Sari", "TK A2", "Perempuan", 5, 109, 17.3, "Gizi Baik", "Kacang", "5th 5bln"],
  ["Laras Ayu", "TK B1", "Perempuan", 6, 114, 18.6, "Gizi Baik", "-", "6th 1bln"],
  ["Mahesa Putra", "TK A1", "Laki-laki", 4, 100, 15.8, "Gizi Baik", "-", "4th 3bln"],
  ["Nadia Safitri", "TK B2", "Perempuan", 6, 115, 19.2, "Gizi Baik", "-", "6th 5bln"],
  ["Omar Faruq", "TK A2", "Laki-laki", 3, 94, 13.9, "Gizi Baik", "Susu Sapi", "3th 7bln"],
  ["Putri Maharani", "TK B1", "Perempuan", 7, 120, 22.1, "Gizi Baik", "-", "7th 1bln"],
  ["Qori Ramadhani", "TK A1", "Perempuan", 4, 102, 16, "Gizi Baik", "-", "4th 7bln"],
  ["Rafi Alfarizi", "TK B2", "Laki-laki", 5, 110, 17.8, "Gizi Baik", "Ikan", "5th 6bln"],
  ["Sinta Dewi", "TK A2", "Perempuan", 5, 107, 16.5, "Gizi Baik", "-", "5th 0bln"],
  ["Tegar Wibowo", "TK B1", "Laki-laki", 6, 117, 19.8, "Gizi Baik", "-", "6th 8bln"],
  ["Ulfa Hanifah", "TK A1", "Perempuan", 3, 96, 14.4, "Gizi Baik", "-", "3th 9bln"],
  ["Vino Hidayat", "TK B2", "Laki-laki", 7, 122, 23.4, "Gizi Baik", "-", "7th 2bln"],
  ["Wulan Sari", "TK A2", "Perempuan", 4, 100, 15.4, "Gizi Baik", "-", "4th 4bln"],
];

const SEED_KID_RECORDS: Kid[] = SEED_KIDS.map(
  ([name, classLabel, gender, ageYears, heightCm, weightKg, status, alergi, ageDisplay], index) => ({
    id: `kid-${index + 1}`,
    name,
    classLabel,
    gender,
    ageYears,
    ageDisplay,
    heightCm,
    weightKg,
    status,
    alergi: alergi || "-",
  }),
);

const SEED_MENUS: WeeklyMenu[] = [
  {
    id: "menu-submitted-1",
    title: "Menu Submitted - 2025-11-25",
    status: "submitted",
    createdBy: "Dr. Ratna Dewi (ahli gizi)",
    createdAt: "16.41",
    days: {
      Senin: ["food-dada-ayam", "food-nasi-putih", "food-brokoli", "food-wortel"],
      Selasa: ["food-telur-rebus", "food-nasi-putih", "food-tempe-goreng"],
      Rabu: ["food-ikan-salmon", "food-nasi-putih", "food-brokoli"],
      Kamis: ["food-dada-ayam", "food-nasi-putih", "food-wortel"],
      Jumat: ["food-telur-rebus", "food-nasi-putih", "food-pisang"],
    },
  },
  {
    id: "menu-draft-1",
    title: "Menu Draft - 2025-11-25",
    status: "draft",
    createdBy: "Dr. Ratna Dewi (ahli gizi)",
    createdAt: "16.41",
    days: {
      Senin: ["food-nasi-putih", "food-tempe-goreng"],
      Selasa: [],
      Rabu: [],
      Kamis: [],
      Jumat: [],
    },
  },
];

export type UserSession = {
  id: string;
  username: string;
  name: string;
  role: string;
  avatarInitials: string;
  defaultPage: string;
};

type AppState = {
  isLoggedIn: boolean;
  username: string;
  currentUser: UserSession | null;
  kids: Kid[];
  foods: Food[];
  menus: WeeklyMenu[];
  notices: Notice[];
};

type AppActions = {
  login: (userOrUsername: string | UserSession) => void;
  logout: () => void;
  addKid: (input: KidInput) => void;
  updateKid: (id: string, input: Partial<KidInput>) => void;
  deleteKid: (id: string) => void;
  addFood: (input: FoodInput) => Food;
  saveDraft: (input: { id?: string; days: DayMenu }) => string;
  submitMenu: (id: string) => void;
  deleteMenu: (id: string) => void;
  notify: (title: string, body: string) => void;
  dismissNotice: (id: string) => void;
  resetKidsData: () => void;
};

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      username: "",
      currentUser: null,
      kids: SEED_KID_RECORDS,
      foods: SEED_FOODS,
      menus: SEED_MENUS,
      notices: [{ id: "notice-approved", title: "Notification", body: "Menu telah di approve" }],

      login: (userOrUsername) => {
        if (typeof userOrUsername === "string") {
          const uname = userOrUsername.trim();
          set({
            isLoggedIn: true,
            username: uname,
            currentUser: {
              id: "usr-custom",
              username: uname,
              name: uname,
              role: "Pengguna",
              avatarInitials: uname.slice(0, 2).toUpperCase() || "US",
              defaultPage: "/rekomendasi-menu",
            },
          });
        } else {
          set({
            isLoggedIn: true,
            username: userOrUsername.username,
            currentUser: userOrUsername,
          });
        }
      },
      logout: () => set({ isLoggedIn: false, username: "", currentUser: null }),

      addKid: (input) =>
        set((state) => ({ kids: [{ id: createId("kid"), ...input }, ...state.kids] })),
      updateKid: (id, input) =>
        set((state) => ({
          kids: state.kids.map((kid) => (kid.id === id ? { ...kid, ...input } : kid)),
        })),
      deleteKid: (id) => set((state) => ({ kids: state.kids.filter((kid) => kid.id !== id) })),

      addFood: (input) => {
        const food: Food = { id: createId("food"), ...input };
        set((state) => ({ foods: [...state.foods, food] }));
        return food;
      },

      saveDraft: ({ id, days }) => {
        const existing = id ? get().menus.find((menu) => menu.id === id) : undefined;
        if (existing?.status === "draft") {
          set((state) => ({
            menus: state.menus.map((menu) => (menu.id === existing.id ? { ...menu, days } : menu)),
          }));
          return existing.id;
        }
        const menu: WeeklyMenu = {
          id: createId("menu"),
          title: `Menu Draft - ${getLocalDate()}`,
          status: "draft",
          createdBy: get().username || "Ahli Gizi",
          createdAt: getLocalTime(),
          days,
        };
        set((state) => ({ menus: [menu, ...state.menus] }));
        return menu.id;
      },

      submitMenu: (id) => {
        set((state) => ({
          menus: state.menus.map((menu) =>
            menu.id === id ? { ...menu, status: "submitted", createdAt: getLocalTime() } : menu,
          ),
        }));
        get().notify("Notification", "Menu berhasil disubmit untuk approval");
      },

      deleteMenu: (id) => set((state) => ({ menus: state.menus.filter((menu) => menu.id !== id) })),

      resetKidsData: () => set({ kids: SEED_KID_RECORDS }),
      notify: (title, body) =>
        set((state) => ({ notices: [...state.notices, { id: createId("notice"), title, body }] })),
      dismissNotice: (id) =>
        set((state) => ({ notices: state.notices.filter((notice) => notice.id !== id) })),
    }),
    {
      name: "sistem-gizi-app",
      version: 3,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version: number) => {
        if (version < 3 || !persistedState?.kids || persistedState.kids.length === 0 || !persistedState.kids[0]?.alergi) {
          return {
            ...persistedState,
            kids: SEED_KID_RECORDS,
          };
        }
        return persistedState;
      },
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        username: state.username,
        currentUser: state.currentUser,
        kids: state.kids,
        foods: state.foods,
        menus: state.menus,
      }),
      skipHydration: true,
    },
  ),
);

if (typeof window !== "undefined") {
  void useAppStore.persist.rehydrate();
}
