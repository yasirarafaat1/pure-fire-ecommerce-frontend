"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  Activity,
  BarChart3,
  BotMessageSquare,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Contact,
  FileText,
  FolderTree,
  Gauge,
  ImageIcon,
  PackageCheck,
  PanelTop,
  RotateCcw,
  Ruler,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Star,
  TicketPercent,
  Truck,
  X,
} from "lucide-react";
import type { AdminRole } from "../types/admin";

type Item = {
  label: string;
  href: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  roles?: AdminRole[];
};

const sections: { label: string; items: Item[] }[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: Gauge },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/admin/products", icon: ShoppingBag },
      { label: "Categories", href: "/admin/categories", icon: FolderTree },
      { label: "Inventory", href: "/admin/inventory", icon: Boxes },
      { label: "Banners", href: "/admin/banners", icon: ImageIcon },
      { label: "Nav Strip", href: "/admin/nav-strip", icon: PanelTop, roles: ["SUPER_ADMIN"] },
      { label: "Size Guide", href: "/admin/size-guide", icon: Ruler, roles: ["SUPER_ADMIN"] },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Orders", href: "/admin/orders", icon: PackageCheck },
      { label: "Promo Codes", href: "/admin/coupons", icon: TicketPercent, roles: ["SUPER_ADMIN", "MANAGER"] },
      { label: "Invoices", href: "/admin/invoices", icon: FileText },
      { label: "Returns", href: "/admin/returns", icon: RotateCcw },
    ],
  },
  {
    label: "Customers",
    items: [
      { label: "Customers", href: "/admin/customers", icon: Contact },
      { label: "Assistant Chats", href: "/admin/assistant", icon: BotMessageSquare },
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

type Props = {
  open: boolean;
  onClose: () => void;
  role: AdminRole;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
};

export default function AdminSidebar({
  open,
  onClose,
  role,
  collapsed,
  onCollapsedChange,
}: Props) {
  const pathname = usePathname();

  const sidebarWidth = collapsed ? "lg:w-[76px]" : "lg:w-[260px]";

  return (
    <>
      {open && (
        <button
          aria-label="Close admin navigation"
          data-close-cursor="true"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-slate-800 bg-slate-950 text-slate-200 transition-all duration-300 ease-in-out lg:translate-x-0 ${sidebarWidth} ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div
          className={`flex h-16 items-center border-b border-white/10 ${
            collapsed ? "justify-center px-3" : "justify-between px-5"
          }`}
        >
          <Link
            href="/admin/dashboard"
            className={`flex min-w-0 items-center font-semibold tracking-tight text-white ${
              collapsed ? "justify-center" : "gap-2"
            }`}
            onClick={onClose}
            title="PureFire Admin"
          >
            <Image
              src="/favicon.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 shrink-0 rounded-full object-cover"
              priority
            />

            {!collapsed && <span className="truncate">PureFire Admin</span>}
          </Link>

          {!collapsed && (
            <button className="rounded-md p-2 hover:bg-white/10 lg:hidden" onClick={onClose}>
              <X size={18} />
            </button>
          )}

          {!collapsed && (
            <button
              aria-label="Collapse admin sidebar"
              className="hidden rounded-md p-2 text-slate-300 hover:bg-white/10 hover:text-white lg:inline-flex"
              onClick={() => onCollapsedChange(true)}
              type="button"
            >
              <ChevronLeft size={18} />
            </button>
          )}
        </div>

        {collapsed && (
          <div className="hidden border-b border-white/10 px-3 py-3 lg:block">
            <button
              aria-label="Expand admin sidebar"
              className="inline-flex h-10 w-full items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white"
              onClick={() => onCollapsedChange(false)}
              type="button"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        <nav className={`flex-1 overflow-y-auto overflow-x-hidden py-5 ${collapsed ? "px-2" : "px-3"}`}>
          {sections.map((section) => {
            const items = section.items.filter((item) => !item.roles || item.roles.includes(role));

            if (!items.length) return null;

            return (
              <div className={collapsed ? "mb-4" : "mb-6"} key={section.label}>
                {!collapsed ? (
                  <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {section.label}
                  </p>
                ) : (
                  <div className="mx-auto mb-2 h-px w-8 bg-white/10" />
                )}

                <div className="grid gap-1">
                  {items.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        title={collapsed ? item.label : undefined}
                        className={`group flex items-center rounded-lg text-sm transition ${
                          collapsed ? "h-11 justify-center px-0" : "gap-3 px-3 py-2.5"
                        } ${
                          active
                            ? "bg-white font-medium !text-slate-950"
                            : "text-slate-300 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <Icon
                          size={collapsed ? 19 : 17}
                          className={`shrink-0 ${
                            active ? "text-slate-950" : "text-slate-300 group-hover:text-white"
                          }`}
                        />

                        {!collapsed && (
                          <>
                            <span className={`min-w-0 flex-1 truncate ${active ? "text-slate-950" : ""}`}>
                              {item.label}
                            </span>

                            {active && <ChevronRight size={14} className="shrink-0 text-slate-950" />}
                          </>
                        )}
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
