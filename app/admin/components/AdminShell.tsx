"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { adminApi } from "../lib/adminApi";
import type { AdminUser } from "../types/admin";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

type MeResponse = {
  status: true;
  admin: AdminUser;
};

const sidebarCollapsedKey = "purefire_admin_sidebar_collapsed";

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      setSidebarCollapsed(localStorage.getItem(sidebarCollapsedKey) === "true");
    } catch {
      setSidebarCollapsed(false);
    }
  }, []);

  const updateSidebarCollapsed = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    try {
      localStorage.setItem(sidebarCollapsedKey, String(collapsed));
    } catch {
      // localStorage may be unavailable in private or restricted contexts.
    }
  };

  useEffect(() => {
    if (pathname === "/admin/login") return;

    adminApi.get<MeResponse>("/auth/me").then((response) => setAdmin(response.admin));
  }, [pathname]);

  if (pathname === "/admin/login") return children;

  if (!admin) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-100">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-300 border-t-slate-950" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <AdminSidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        role={admin.role}
        collapsed={sidebarCollapsed}
        onCollapsedChange={updateSidebarCollapsed}
      />

      <div
        className={`min-h-screen min-w-0 transition-[margin] duration-300 ease-in-out ${
          sidebarCollapsed ? "lg:ml-[76px]" : "lg:ml-[260px]"
        }`}
      >
        <AdminTopbar
          admin={admin}
          onMenu={() => {
            updateSidebarCollapsed(false);
            setMenuOpen(true);
          }}
        />

        <main className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
