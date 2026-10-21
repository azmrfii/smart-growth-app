import {
  IconChevronLeft,
  IconFileText,
  IconHeartRateMonitor,
  IconLogout,
  IconRuler2,
  IconUsers,
  IconUserShield,
  IconWand,
} from "@tabler/icons-react";
import { NavLink, useNavigate } from "react-router";

import { useAppStore } from "@/lib/nutrition-store";

type NavItem = {
  to: string;
  label: string;
  icon: typeof IconUsers;
  roles: string[];
};

const ALL_NAV_ITEMS: NavItem[] = [
  {
    to: "/kelola-pengguna",
    label: "Kelola Pengguna",
    icon: IconUserShield,
    roles: ["Super Admin"],
  },
  {
    to: "/data-anak",
    label: "Data Anak",
    icon: IconUsers,
    roles: ["Tata Usaha"],
  },
  {
    to: "/laporan-menu",
    label: "Laporan Menu",
    icon: IconFileText,
    roles: ["Admin dapur MBG"],
  },
  {
    to: "/standar-gizi",
    label: "Standar Gizi",
    icon: IconRuler2,
    roles: ["Ahli Gizi"],
  },
  {
    to: "/status-gizi",
    label: "Status Gizi",
    icon: IconHeartRateMonitor,
    roles: ["Admin dapur MBG", "Ahli Gizi"],
  },
  {
    to: "/rekomendasi-menu",
    label: "Rekomendasi Menu",
    icon: IconWand,
    roles: ["Ahli Gizi"],
  },
];

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const logout = useAppStore((state) => state.logout);
  const currentUser = useAppStore((state) => state.currentUser);
  const navigate = useNavigate();

  const displayName = currentUser?.name || "Dimas Vikriansyah";
  const displayRole = currentUser?.role || "Super Admin";
  const displayInitials = currentUser?.avatarInitials || "DV";

  const handleLogout = () => {
    logout();
    navigate("/masuk", { replace: true });
  };

  // Filter navigation items specifically for the active user's role
  const activeNavItems = ALL_NAV_ITEMS.filter((item) =>
    item.roles.includes(displayRole),
  );

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-[#0891B2] text-white shadow-[0_20px_25px_-5px_rgba(0,0,0,0.10),0_8px_10px_-6px_rgba(0,0,0,0.10)] transition-[width] ${
        collapsed ? "w-[72px]" : "w-64"
      }`}
    >
      <div className="flex flex-col gap-2 border-b border-white/15 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          {collapsed ? null : (
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight">Sistem Gizi</span>
            </div>
          )}
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? "Buka sidebar" : "Tutup sidebar"}
            className="flex size-8 items-center justify-center rounded-lg hover:bg-white/10"
          >
            <IconChevronLeft
              size={16}
              stroke={1.33}
              color="white"
              className={collapsed ? "rotate-180" : ""}
            />
          </button>
        </div>

        {collapsed ? null : (
          <div className="flex items-center gap-3 pt-2">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#DAF8FF] text-sm font-bold text-[#0891B2] shadow-xs">
              {displayInitials}
            </span>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-bold text-white" title={displayName}>
                {displayName}
              </span>
              <span className="truncate text-xs font-medium text-cyan-100" title={displayRole}>
                {displayRole}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pt-3 pb-1">
        {collapsed ? null : (
          <span className="text-[10px] font-bold tracking-wider text-white/60 uppercase">
            Menu {displayRole}
          </span>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 p-4 pt-1">
        {activeNavItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              `flex h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-white text-[#0891B2] shadow-xs"
                  : "text-white/90 hover:bg-white/10 hover:text-white"
              } ${collapsed ? "justify-center px-0" : ""}`
            }
          >
            <Icon size={19} stroke={1.8} className="shrink-0" />
            {collapsed ? null : <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/15 p-4">
        <button
          type="button"
          onClick={handleLogout}
          title="Keluar"
          className={`flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-sm font-medium text-white hover:bg-white/10 transition-colors ${
            collapsed ? "justify-center px-0" : ""
          }`}
        >
          <IconLogout size={19} stroke={1.8} className="shrink-0" />
          {collapsed ? null : <span>Keluar</span>}
        </button>
      </div>
    </aside>
  );
}
