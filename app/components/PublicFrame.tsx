"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "../home/components/navbar";
import AssistantWidget from "./assistant/AssistantWidget";
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
    pathname.startsWith("/search") ||
    pathname.startsWith("/order-success") ||
    pathname.startsWith("/order-failed");

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
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar onOpenCart={() => setCartOpen(true)} />
      <main className="flex-1 pt-4">
        <div key={pathname} className="page-transition">
          {children}
        </div>
      </main>
      {showFooter && <Footer />}
      <AssistantWidget />
      <CartModal open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
