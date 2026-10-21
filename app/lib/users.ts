import usersData from "@/data/users.json";

export type UserCredential = {
  id: string;
  username: string;
  password: string;
  name: string;
  role: string;
  avatarInitials: string;
  defaultPage: string;
  pageTitle: string;
  description: string;
};

export const USERS: UserCredential[] = [
  {
    id: "usr-1",
    name: "Dimas Vikriansyah",
    username: "dimas_vikrian",
    password: "password123",
    role: "Super Admin",
    avatarInitials: "DV",
    defaultPage: "/kelola-pengguna",
    pageTitle: "Kelola Pengguna",
    description: "Super Admin - Mengelola pengguna dan hak akses sistem",
  },
  {
    id: "usr-2",
    name: "Siti Aminah",
    username: "siti_aminah",
    password: "password123",
    role: "Tata Usaha",
    avatarInitials: "SA",
    defaultPage: "/data-anak",
    pageTitle: "Data Anak",
    description: "Tata Usaha - Pengelolaan data anak dan kelas",
  },
  {
    id: "usr-4",
    name: "Budi Santoso",
    username: "budi_santoso",
    password: "password123",
    role: "Admin dapur MBG",
    avatarInitials: "BS",
    defaultPage: "/laporan-menu",
    pageTitle: "Laporan Menu",
    description: "Admin dapur MBG - Akses laporan final menu dan distribusi makanan",
  },
  {
    id: "usr-3",
    name: "Dr. Ratna Dewi",
    username: "ratna_dewi",
    password: "password123",
    role: "Ahli Gizi",
    avatarInitials: "RD",
    defaultPage: "/rekomendasi-menu",
    pageTitle: "Rekomendasi Menu",
    description: "Ahli Gizi - Penyusunan rekomendasi menu gizi harian dan mingguan",
  },
];

export function findUserByUsername(username: string): UserCredential | undefined {
  return USERS.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
}

export function validateLogin(username: string, password: string): UserCredential | null {
  const user = findUserByUsername(username);
  if (user && user.password === password) {
    return user;
  }
  return null;
}
