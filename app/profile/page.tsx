"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  FiHeart,
  FiMapPin,
  FiSettings,
  FiShoppingBag,
  FiUser,
} from "react-icons/fi";
import ProfileForm from "./components/ProfileForm";
import OrdersSection from "./components/OrdersSection";
import WishlistSection from "./components/WishlistSection";
import AddressesSection from "./components/AddressesSection";
import SettingsSection from "./components/SettingsSection";
import { getUserEmail, getUserToken, logoutExpiredUser } from "../utils/auth";

type SectionKey = "profile" | "orders" | "wishlist" | "addresses" | "settings";

const sections: {
  key: SectionKey;
  label: string;
  shortLabel: string;
  description: string;
  icon: ReactElement;
}[] = [
  {
    key: "profile",
    label: "Profile",
    shortLabel: "Profile",
    description: "Manage your personal details.",
    icon: <FiUser />,
  },
  {
    key: "orders",
    label: "Orders",
    shortLabel: "Orders",
    description: "Track purchases and order history.",
    icon: <FiShoppingBag />,
  },
  {
    key: "wishlist",
    label: "Wishlist",
    shortLabel: "Wishlist",
    description: "View products saved for later.",
    icon: <FiHeart />,
  },
  {
    key: "addresses",
    label: "Addresses",
    shortLabel: "Address",
    description: "Manage delivery addresses.",
    icon: <FiMapPin />,
  },
  {
    key: "settings",
    label: "Settings",
    shortLabel: "Settings",
    description: "Control account preferences.",
    icon: <FiSettings />,
  },
];

function ProfilePageSkeleton() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 pb-24 md:px-6 md:pb-6">
      <div className="grid gap-6 md:grid-cols-[270px_minmax(0,1fr)] md:items-start">
        <aside className="hidden rounded-[4px] border border-slate-200 bg-white p-3 shadow-sm md:grid">
          <div className="h-5 w-24 animate-pulse rounded-[4px] bg-slate-100" />
          <div className="mt-4 grid gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-12 animate-pulse rounded-[4px] border border-slate-100 bg-slate-50"
              />
            ))}
          </div>
        </aside>

        <section className="rounded-[4px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="h-6 w-32 animate-pulse rounded-[4px] bg-slate-100" />
          <div className="mt-5 h-4 w-60 animate-pulse rounded-[4px] bg-slate-100" />

          <div className="mt-8 flex items-center gap-4">
            <div className="h-16 w-16 animate-pulse rounded-full bg-slate-100" />
            <div className="grid gap-2">
              <div className="h-4 w-44 animate-pulse rounded-[4px] bg-slate-100" />
              <div className="h-4 w-32 animate-pulse rounded-[4px] bg-slate-100" />
            </div>
          </div>

          <div className="mt-8 grid gap-4">
            <div className="h-11 animate-pulse rounded-[4px] border border-slate-100 bg-slate-50" />
            <div className="h-11 animate-pulse rounded-[4px] border border-slate-100 bg-slate-50" />
            <div className="h-11 w-36 animate-pulse rounded-[4px] bg-slate-100" />
          </div>
        </section>
      </div>
    </main>
  );
}

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
        return;
      }

      logoutExpiredUser(next);
    };

    window.addEventListener("auth:changed", handleAuth as EventListener);
    window.addEventListener("auth:updated", handleAuth as EventListener);
    window.addEventListener("storage", handleAuth as EventListener);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("auth:changed", handleAuth as EventListener);
      window.removeEventListener("auth:updated", handleAuth as EventListener);
      window.removeEventListener("storage", handleAuth as EventListener);
    };
  }, [pathname, router]);

  const activeSection = useMemo(() => {
    return sections.find((section) => section.key === active) || sections[0];
  }, [active]);

  const userInitial = useMemo(() => {
    const source = userEmail || "User";
    return source.slice(0, 1).toUpperCase();
  }, [userEmail]);

  if (!authReady) {
    return <ProfilePageSkeleton />;
  }

  return (
    <>
      <main className="profile-page-main mx-auto max-w-6xl px-4 py-6 pb-36 text-slate-950 md:px-6 md:pb-6">
        <div className="mb-5 rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm md:hidden">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[4px] bg-slate-950 text-sm font-black text-white">
              {userInitial}
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                My Account
              </p>
              <h1 className="truncate text-lg font-black text-slate-950">
                {activeSection.label}
              </h1>
              <p className="truncate text-xs font-semibold text-slate-500">
                {activeSection.description}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[270px_minmax(0,1fr)] md:items-start">
          <aside className="profile-sidebar hidden md:block md:self-start">
            <div className="profile-sidebar-card overflow-hidden rounded-[4px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-950 p-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[4px] bg-white text-sm font-black text-slate-950">
                    {userInitial}
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/55">
                      Account
                    </p>
                    <p className="mt-1 truncate text-sm font-black text-white">
                      {userEmail || "Customer"}
                    </p>
                  </div>
                </div>
              </div>

              <nav
                data-lenis-prevent
                className="profile-sidebar-nav grid gap-1 overflow-y-auto p-2 scrollbar-hide"
              >
                {sections.map((section) => {
                  const selected = active === section.key;

                  return (
                    <button
                      key={section.key}
                      type="button"
                      className={`group grid w-full grid-cols-[36px_minmax(0,1fr)] items-center gap-3 rounded-[4px] border px-2 py-2.5 text-left transition ${
                        selected
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-transparent bg-white text-slate-800 hover:border-slate-950 hover:bg-slate-950 hover:text-white"
                      }`}
                      onClick={() => setActive(section.key)}
                    >
                      <span
                        className={`grid h-9 w-9 place-items-center rounded-[4px] text-lg transition ${
                          selected
                            ? "bg-white text-slate-950"
                            : "bg-slate-100 text-slate-700 group-hover:bg-white group-hover:text-slate-950"
                        }`}
                      >
                        {section.icon}
                      </span>

                      <span className="min-w-0">
                        <span
                          className={`block truncate text-sm font-black ${
                            selected
                              ? "text-white"
                              : "text-slate-950 group-hover:text-white"
                          }`}
                        >
                          {section.label}
                        </span>
                        <span
                          className={`mt-0.5 block truncate text-xs font-semibold ${
                            selected
                              ? "text-white/65"
                              : "text-slate-500 group-hover:text-white/65"
                          }`}
                        >
                          {section.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          <section className="min-h-[520px] overflow-hidden rounded-[4px] border border-slate-200 bg-white shadow-sm">
            <div className="hidden border-b border-slate-200 bg-white px-5 py-4 md:block">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                My Account
              </p>

              <h1 className="mt-1 text-2xl font-black tracking-[-0.03em] text-slate-950">
                {activeSection.label}
              </h1>

              <p className="mt-1 text-sm font-semibold text-slate-500">
                {activeSection.description}
              </p>
            </div>

            <div key={active} className="profile-switch p-3 md:p-5">
              {active === "profile" && <ProfileForm email={userEmail} />}
              {active === "orders" && <OrdersSection email={userEmail} />}
              {active === "wishlist" && <WishlistSection email={userEmail} />}
              {active === "addresses" && (
                <AddressesSection email={userEmail} />
              )}
              {active === "settings" && <SettingsSection email={userEmail} />}
            </div>
          </section>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1 py-2">
          {sections.map((section) => {
            const selected = active === section.key;

            return (
              <button
                key={section.key}
                type="button"
                onClick={() => setActive(section.key)}
                aria-label={section.label}
                aria-current={selected ? "page" : undefined}
                className={`flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-[4px] px-1 transition active:scale-[0.97] ${
                  selected
                    ? "bg-slate-950 text-white"
                    : "bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="text-xl">{section.icon}</span>
                <span className="max-w-full truncate text-[10px] font-black leading-none">
                  {section.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <style jsx>{`
        .profile-switch {
          animation: profileSwitch 360ms ease both;
          will-change: transform, opacity;
        }

        @keyframes profileSwitch {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 767px) {
          .profile-page-main {
            padding-bottom: max(9rem, calc(env(safe-area-inset-bottom) + 116px));
          }
        }

        @media (min-width: 768px) {
          .profile-sidebar {
            position: sticky;
            top: calc(var(--nav-shell-top, 0px) + 88px);
            align-self: start;
            height: calc(100dvh - var(--nav-shell-top, 0px) - 108px);
          }

          .profile-sidebar-card {
            display: flex;
            max-height: 100%;
            flex-direction: column;
          }

          .profile-sidebar-nav {
            max-height: calc(100dvh - var(--nav-shell-top, 0px) - 220px);
            overscroll-behavior: contain;
          }
        }
      `}</style>
    </>
  );
}
