"use client";

import { LogOut, Menu, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { adminApi } from "../lib/adminApi";
import type { AdminUser } from "../types/admin";

const titleFromPath = (pathname: string) => {
  const segment = pathname.split("/").filter(Boolean).at(-1) || "dashboard";
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

type Props = { admin: AdminUser; onMenu: () => void };

export default function AdminTopbar({ admin, onMenu }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = async () => {
    await adminApi.post("/auth/logout");
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <button
        aria-label="Open admin navigation"
        className="rounded-lg border border-slate-200 p-2 text-slate-700 lg:hidden"
        onClick={onMenu}
      >
        <Menu size={19} />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold text-slate-950">{titleFromPath(pathname)}</h1>
      </div>
      <div className="hidden max-w-xs flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-400 md:flex">
        <Search size={16} />
        <span className="text-sm">Search within the current page</span>
      </div>
      <button
        className="rounded-lg bg-red-500 border border-slate-300 px-3 py-2 text-sm font-medium text-white hover:text-white hover:bg-red-300"
        onClick={logout}
      >
        <LogOut size={14} />
      </button>
    </header>
  );
}
