"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Activity,
  Boxes,
  ChevronRight,
  CircleDollarSign,
  Contact,
  FolderTree,
  Gauge,
  ImageIcon,
  PackageCheck,
  RotateCcw,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  X,
} from "lucide-react";
import type { AdminRole } from "../types/admin";

type Item = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  roles?: AdminRole[];
};

const sections: { label: string; items: Item[] }[] = [
  { label: "Overview", items: [{ label: "Dashboard", href: "/admin/dashboard", icon: Gauge }] },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/admin/products", icon: ShoppingBag },
      { label: "Categories", href: "/admin/categories", icon: FolderTree },
      { label: "Inventory", href: "/admin/inventory", icon: Boxes },
      { label: "Banners", href: "/admin/banners", icon: ImageIcon },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Orders", href: "/admin/orders", icon: PackageCheck },
      { label: "Returns", href: "/admin/returns", icon: RotateCcw },
    ],
  },
  {
    label: "Customers",
    items: [
      { label: "Customers", href: "/admin/customers", icon: Contact },
      { label: "Reviews", href: "/admin/reviews", icon: Star },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Shipping", href: "/admin/shipping", icon: Truck },
      { label: "Payments", href: "/admin/payments", icon: CircleDollarSign },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Store Settings", href: "/admin/settings", icon: Settings, roles: ["SUPER_ADMIN"] },
      { label: "Activity Logs", href: "/admin/audit-logs", icon: Activity, roles: ["SUPER_ADMIN"] },
      { label: "Change Password", href: "/admin/change-password", icon: ShieldCheck },
    ],
  },
];

type Props = { open: boolean; onClose: () => void; role: AdminRole };

export default function AdminSidebar({ open, onClose, role }: Props) {
  const pathname = usePathname();
  return (
    <>
      {open && (
        <button
          aria-label="Close admin navigation"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-slate-200 bg-slate-950 text-slate-200 transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold tracking-tight text-white">
            <Image
              src="/favicon.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 rounded-full object-cover"
              priority
            />
            PureFire Admin
          </Link>
          <button className="rounded-md p-2 hover:bg-white/10 lg:hidden" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {sections.map((section) => {
            const items = section.items.filter((item) => !item.roles || item.roles.includes(role));
            if (!items.length) return null;
            return (
              <div className="mb-6" key={section.label}>
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {section.label}
                </p>
                <div className="grid gap-1">
                  {items.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${active
                          ? "bg-white font-medium !text-slate-950"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                          }`}
                      >
                        <Icon size={17} className={active ? "text-slate-950" : undefined} />
                        <span className={`flex-1 ${active ? "text-slate-950" : ""}`}>{item.label}</span>
                        {active && <ChevronRight size={14} />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
