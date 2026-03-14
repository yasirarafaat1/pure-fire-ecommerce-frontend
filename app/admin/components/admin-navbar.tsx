"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/banners", label: "Banners" },
  { href: "/admin/add-category", label: "Categories" },
  { href: "/admin/upload-product", label: "Upload Product" },
  { href: "/admin/inventory", label: "Inventory" },
];

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-20 border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          {/* <div className="pill">Admin</div> */}
          <div className="font-semibold tracking-tight">PureFire Panel</div>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {links.map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-[5px] transition-colors duration-200 ease-out ${
                  active
                    ? "bg-[var(--accent)] !text-white border border-black/60"
                    : "text-[var(--muted)] border border-transparent hover:text-[var(--ink)] hover:border-black/30"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <button
            className="ml-2 px-3 py-2 rounded-md text-sm bg-red-600 text-white hover:bg-red-700"
            onClick={logout}
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
