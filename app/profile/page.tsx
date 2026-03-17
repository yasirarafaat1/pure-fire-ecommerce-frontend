"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FiUser, FiShoppingBag, FiHeart, FiMapPin, FiSettings, FiLogOut } from "react-icons/fi";
import ProfileForm from "./components/ProfileForm";
import OrdersSection from "./components/OrdersSection";
import WishlistSection from "./components/WishlistSection";
import AddressesSection from "./components/AddressesSection";
import SettingsSection from "./components/SettingsSection";
import LogoutSection from "./components/LogoutSection";
import { getUserEmail, getUserToken } from "../utils/auth";

type SectionKey = "profile" | "orders" | "wishlist" | "addresses" | "settings" | "logout";

const sections: { key: SectionKey; label: string; icon: JSX.Element }[] = [
  { key: "profile", label: "Profile", icon: <FiUser /> },
  { key: "orders", label: "Orders", icon: <FiShoppingBag /> },
  { key: "wishlist", label: "Wishlist", icon: <FiHeart /> },
  { key: "addresses", label: "Addresses", icon: <FiMapPin /> },
  { key: "settings", label: "Settings", icon: <FiSettings /> },
  { key: "logout", label: "Logout", icon: <FiLogOut /> },
];

export default function ProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState<SectionKey>("profile");
  const [userEmail, setUserEmail] = useState("");
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const next = pathname || "/profile";
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

  const heading = useMemo(() => {
    const hit = sections.find((s) => s.key === active);
    return hit?.label || "Profile";
  }, [active]);

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
    <main className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid gap-6 md:grid-cols-[260px_1fr] items-start">
        <aside className="card p-3 md:sticky md:top-24">
          <div className="text-sm font-semibold px-2 pb-2 border-b border-black/10">Account</div>
          <div className="grid gap-1 pt-2">
            {sections.map((s) => {
              const selected = active === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  className={`flex items-center gap-2 px-3 py-2 rounded-[5px] border text-sm cursor-pointer ${
                    selected ? "bg-black text-white border-black" : "bg-white text-black border-black/20"
                  }`}
                  onClick={() => setActive(s.key)}
                >
                  <span className="text-base">{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="card p-5 min-h-[480px]">
          <h1 className="text-lg font-semibold mb-4">{heading}</h1>
          {active === "profile" && <ProfileForm email={userEmail} />}
          {active === "orders" && <OrdersSection />}
          {active === "wishlist" && <WishlistSection email={userEmail} />}
          {active === "addresses" && <AddressesSection email={userEmail} />}
          {active === "settings" && <SettingsSection />}
          {active === "logout" && <LogoutSection onCancel={() => setActive("profile")} />}
        </section>
      </div>
    </main>
  );
}







