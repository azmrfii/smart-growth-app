import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";

import { Sidebar } from "@/components/app-shell/Sidebar";
import { Toasts } from "@/components/app-shell/Toasts";
import { useAppStore } from "@/lib/nutrition-store";

export default function AppLayout() {
  const isLoggedIn = useAppStore((state) => state.isLoggedIn);
  const [ready, setReady] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return null;
  if (!isLoggedIn) return <Navigate to="/masuk" replace />;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#0A0A0A]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      <main className={`min-h-screen transition-[padding] ${collapsed ? "pl-[72px]" : "pl-64"}`}>
        <div className="mx-auto flex max-w-[1240px] flex-col gap-6 p-6">
          <Outlet />
        </div>
      </main>
      <Toasts />
    </div>
  );
}
