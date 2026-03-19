"use client";

import { usePathname } from "next/navigation";
import Navbar from "../home/components/navbar";
import Footer from "./Footer";

export default function PublicFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const hide =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/search");

  const showFooter =
    pathname === "/" ||
    pathname.startsWith("/home") ||
    pathname.startsWith("/product") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/wishlist");

  if (hide) return <>{children}</>;

  return (
    <>
      <Navbar />
      <div className="mt-4">{children}</div>
      {showFooter && <Footer />}
    </>
  );
}
