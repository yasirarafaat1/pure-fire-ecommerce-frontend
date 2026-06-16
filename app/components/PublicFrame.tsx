"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "../home/components/navbar";
import CartModal from "./CartModal";
import Footer from "./Footer";

export default function PublicFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const [cartOpen, setCartOpen] = useState(false);
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
    pathname.startsWith("/wishlist");

  useEffect(() => {
    const openCart = () => setCartOpen(true);
    window.addEventListener("cart:open", openCart);
    return () => window.removeEventListener("cart:open", openCart);
  }, []);

  if (hide) return <>{children}</>;

  return (
    <>
      <Navbar onOpenCart={() => setCartOpen(true)} />
      <div className="mt-4">
        <div key={pathname} className="page-transition">
          {children}
        </div>
      </div>
      {showFooter && <Footer />}
      <CartModal open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
