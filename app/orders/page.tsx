"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import OrdersSection from "../profile/components/OrdersSection";
import { getUserEmail, getUserToken } from "../utils/auth";

export default function OrdersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [authReady, setAuthReady] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const next = pathname || "/orders";
    const maxAttempts = 15;
    let attempts = 0;

    const tryAuth = () => {
      const token = getUserToken();
      if (!token) return false;
      const email = getUserEmail();
      if (email) setUserEmail(email);
      setAuthReady(true);
      return true;
    };

    if (tryAuth()) return;

    const intervalId = window.setInterval(() => {
      attempts += 1;
      if (tryAuth()) {
        window.clearInterval(intervalId);
        return;
      }
      if (attempts >= maxAttempts) {
        window.clearInterval(intervalId);
        router.replace(`/login?next=${encodeURIComponent(next)}`);
      }
    }, 100);

    const handleAuth = () => {
      if (tryAuth()) {
        window.clearInterval(intervalId);
      }
    };

    window.addEventListener("auth:changed", handleAuth as EventListener);
    window.addEventListener("storage", handleAuth as EventListener);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("auth:changed", handleAuth as EventListener);
      window.removeEventListener("storage", handleAuth as EventListener);
    };
  }, []);

  if (!authReady) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center py-16 text-sm text-[var(--muted)]">
          Loading...
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto py-1">
      <div className="p-3">
        <h1 className="text-xl font-semibold mb-4">Orders</h1>
        <OrdersSection email={userEmail} />
      </div>
    </main>
  );
}
