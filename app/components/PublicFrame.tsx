"use client";

import { usePathname } from "next/navigation";
import Navbar from "../home/components/navbar";

export default function PublicFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const hide =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/search");

  if (hide) return <>{children}</>;

  return (
    <>
      <Navbar />
      <div className="mt-4">{children}</div>
    </>
  );
}
