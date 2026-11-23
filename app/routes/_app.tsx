import { IconMenu2 } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";

import { Sidebar } from "@/components/app-shell/Sidebar";
import { Toasts } from "@/components/app-shell/Toasts";
import { AuthController } from "@/lib/auth-controller";
import { useAppStore } from "@/lib/nutrition-store";

export default function AppLayout() {
  const isLoggedIn = useAppStore((state) => state.isLoggedIn);
  const [ready, setReady] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setReady(true);
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => {
      setIsMobile(mq.matches);
      if (!mq.matches) setMobileOpen(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  if (!ready) return null;
  if (!isLoggedIn) return <Navigate to={AuthController.redirectToLogin()} replace />;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#0A0A0A]">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      {isMobile ? (
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-black/10 bg-white px-4">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Buka menu"
            className="flex size-9 items-center justify-center rounded-lg hover:bg-black/5"
          >
            <IconMenu2 size={20} stroke={1.8} />
          </button>
          <span className="text-base font-bold text-[#0891B2]">Sistem Gizi</span>
        </header>
      ) : null}
      <main className={`min-h-screen transition-[padding] ${isMobile ? "pl-0" : collapsed ? "pl-[72px]" : "pl-64"}`}>
        <div className="mx-auto flex max-w-[1240px] flex-col gap-6 p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
      <Toasts />
    </div>
  );
}
