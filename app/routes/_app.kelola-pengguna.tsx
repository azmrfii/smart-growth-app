import {
  IconCheck,
  IconEdit,
  IconKey,
  IconPlus,
  IconSearch,
  IconTrash,
  IconUser,
  IconUserCheck,
  IconUserShield,
} from "@tabler/icons-react";
import { useState } from "react";

import { ConfirmDialog, Modal } from "@/components/app-shell/Modal";
import { useAppStore } from "@/lib/nutrition-store";

export function meta() {
  return [{ title: "Kelola Pengguna - Sistem Gizi" }];
}

export type ManagedUser = {
  id: string;
  name: string;
  username: string;
  role: "Super Admin" | "Tata Usaha" | "Admin dapur MBG" | "Ahli Gizi";
  status: "Aktif" | "Nonaktif";
  initials: string;
  createdAt: string;
};

const INITIAL_USERS: ManagedUser[] = [
  {
    id: "usr-1",
    name: "Dimas Vikriansyah",
    username: "dimas_vikrian",
    role: "Super Admin",
    status: "Aktif",
    initials: "DV",
    createdAt: "10 Jan 2025",
  },
  {
    id: "usr-2",
    name: "Siti Aminah",
    username: "siti_aminah",
    role: "Tata Usaha",
    status: "Aktif",
    initials: "SA",
    createdAt: "15 Jan 2025",
  },
  {
    id: "usr-4",
    name: "Budi Santoso",
    username: "budi_santoso",
    role: "Admin dapur MBG",
    status: "Aktif",
    initials: "BS",
    createdAt: "01 Feb 2025",
  },
  {
    id: "usr-3",
    name: "Dr. Ratna Dewi",
    username: "ratna_dewi",
    role: "Ahli Gizi",
    status: "Aktif",
    initials: "RD",
    createdAt: "20 Jan 2025",
  },
];

const ROLE_BADGES: Record<ManagedUser["role"], { bg: string; text: string; border: string }> = {
  "Super Admin": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  "Tata Usaha": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  "Admin dapur MBG": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  "Ahli Gizi": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
};

export default function KelolaPenggunaRoute() {
  const [users, setUsers] = useState<ManagedUser[]>(INITIAL_USERS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);

  const [formName, setFormName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<ManagedUser["role"]>("Tata Usaha");

  const notify = useAppStore((state) => state.notify);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormName("");
    setFormUsername("");
    setFormPassword("");
    setFormRole("Tata Usaha");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: ManagedUser) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormPassword("");
    setFormRole(user.role);
    setIsModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUsername.trim()) return;

    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                name: formName.trim(),
                username: formUsername.trim(),
                role: formRole,
                initials: formName
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase(),
              }
            : u,
        ),
      );
      notify("Pengguna Diperbarui", `Data pengguna ${formName} berhasil disimpan.`);
    } else {
      const newUser: ManagedUser = {
        id: `usr-${Date.now()}`,
        name: formName.trim(),
        username: formUsername.trim(),
        role: formRole,
        status: "Aktif",
        initials: formName
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        createdAt: new Date().toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      };
      setUsers((prev) => [newUser, ...prev]);
      notify("Pengguna Ditambahkan", `Pengguna ${formName} berhasil didaftarkan ke sistem.`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!userToDelete) return;
    setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
    notify("Pengguna Dihapus", `Pengguna ${userToDelete.name} telah dinonaktifkan dari sistem.`);
    setUserToDelete(null);
  };

  return (
    <>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A0A0A]">Kelola Pengguna</h1>
          <p className="text-sm text-[#4A5565]">Mengelola data pengguna sistem dan hak akses akun</p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0891B2] px-4 text-sm font-medium text-white shadow-xs transition hover:bg-[#0E7490]"
        >
          <IconPlus size={18} />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-xs">
          <span className="text-xs text-[#64748B]">Total Pengguna</span>
          <p className="mt-1 text-2xl font-bold text-[#0F172A]">{users.length}</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-xs">
          <span className="text-xs text-[#64748B]">Pengguna Aktif</span>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {users.filter((u) => u.status === "Aktif").length}
          </p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-xs">
          <span className="text-xs text-[#64748B]">Hak Akses / Roles</span>
          <p className="mt-1 text-2xl font-bold text-[#0891B2]">4 Peran</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-xs">
          <span className="text-xs text-[#64748B]">Level Keamanan</span>
          <p className="mt-1 text-base font-bold text-purple-700">Role-Based Access</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <IconSearch size={18} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau username..."
            className="h-10 w-full rounded-xl border border-black/10 bg-white pr-4 pl-9 text-sm outline-none placeholder:text-slate-400 focus:border-[#0891B2]"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm text-[#0F172A] outline-none focus:border-[#0891B2]"
        >
          <option value="all">Semua Peran</option>
          <option value="Super Admin">Super Admin</option>
          <option value="Tata Usaha">Tata Usaha</option>
          <option value="Admin dapur MBG">Admin dapur MBG</option>
          <option value="Ahli Gizi">Ahli Gizi</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left text-sm">
            <thead className="border-b border-black/10 bg-[#F8FAFC] text-xs font-semibold text-[#64748B]">
              <tr>
                <th className="px-5 py-3.5">PENGGUNA</th>
                <th className="px-5 py-3.5">PERAN SISTEM</th>
                <th className="px-5 py-3.5">STATUS</th>
                <th className="px-5 py-3.5">TANGGAL DIBUAT</th>
                <th className="px-5 py-3.5 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 text-[#0F172A]">
              {filteredUsers.map((user) => {
                const badge = ROLE_BADGES[user.role];
                return (
                  <tr key={user.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E0F2FE] text-xs font-bold text-[#0369A1]">
                          {user.initials}
                        </span>
                        <div>
                          <span className="font-semibold block text-sm">{user.name}</span>
                          <span className="text-xs text-[#64748B]">@{user.username}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        {user.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#64748B]">{user.createdAt}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(user)}
                          aria-label={`Edit ${user.name}`}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        >
                          <IconEdit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserToDelete(user)}
                          aria-label={`Hapus ${user.name}`}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700"
                        >
                          <IconTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen ? (
        <Modal
          title={editingUser ? "Edit Pengguna" : "Tambah Pengguna Baru"}
          onClose={() => setIsModalOpen(false)}
        >
          <form onSubmit={handleSaveUser} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-[#1D293D]">Nama Lengkap</span>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Contoh: Dimas Vikriansyah"
                className="h-10 rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#0891B2]"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-[#1D293D]">Username</span>
              <input
                type="text"
                required
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                placeholder="Contoh: dimas_vikrian"
                className="h-10 rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#0891B2]"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-[#1D293D]">
                Password {editingUser ? "(Kosongkan jika tidak diubah)" : ""}
              </span>
              <input
                type="password"
                required={!editingUser}
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Masukkan password"
                className="h-10 rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#0891B2]"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-[#1D293D]">Peran / Role</span>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as ManagedUser["role"])}
                className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:border-[#0891B2]"
              >
                <option value="Super Admin">Super Admin</option>
                <option value="Tata Usaha">Tata Usaha</option>
                <option value="Admin dapur MBG">Admin dapur MBG</option>
                <option value="Ahli Gizi">Ahli Gizi</option>
              </select>
            </label>

            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-10 rounded-xl border border-black/10 px-4 text-sm font-medium hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="h-10 rounded-xl bg-[#0891B2] px-4 text-sm font-medium text-white hover:bg-[#0E7490]"
              >
                Simpan
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {userToDelete ? (
        <ConfirmDialog
          title="Hapus Pengguna?"
          message={`Apakah Anda yakin ingin menonaktifkan pengguna ${userToDelete.name}? Pengguna ini tidak akan bisa login kembali.`}
          confirmLabel="Hapus"
          onConfirm={handleDelete}
          onCancel={() => setUserToDelete(null)}
        />
      ) : null}
    </>
  );
}
