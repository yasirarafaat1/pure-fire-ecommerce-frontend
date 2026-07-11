"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiAlertTriangle,
  FiChevronRight,
  FiFileText,
  FiLogOut,
  FiMail,
  FiShield,
  FiX,
} from "react-icons/fi";
import { clearUserAuth } from "../../utils/auth";

export default function SettingsSection({ email }: { email: string }) {
  const router = useRouter();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleLogout = () => {
    clearUserAuth();
    window.dispatchEvent(new Event("wishlist:updated"));
    window.dispatchEvent(new Event("cart:updated"));
    window.dispatchEvent(new Event("auth:changed"));
    router.replace("/login");
  };

  return (
    <>
      <div className="grid gap-5">
        <section className="overflow-hidden rounded-[4px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-950 px-4 py-4 text-white">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[4px] bg-white text-lg text-slate-950">
                <FiShield />
              </span>

              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/55">
                  Account Settings
                </p>
                <h2 className="mt-1 text-lg font-black tracking-[-0.03em] text-white">
                  Manage your account
                </h2>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-4">
            <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[4px] bg-white text-lg text-slate-700 ring-1 ring-slate-200">
                  <FiMail />
                </span>

                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                    Registered Email
                  </p>
                  <p className="mt-1 break-all text-sm font-black text-slate-950">
                    {email || "-"}
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                    This email is used for login OTP and account communication.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <p className="text-sm font-black text-slate-950">
                Legal & Policies
              </p>

              <Link
                href="/privacy-policy"
                className="group flex items-center justify-between gap-3 rounded-[4px] border border-slate-200 bg-white px-4 py-3 text-sm transition hover:border-slate-950 hover:bg-slate-950"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[4px] bg-slate-100 text-slate-700 transition group-hover:bg-white group-hover:text-slate-950">
                    <FiFileText />
                  </span>

                  <span className="min-w-0">
                    <span className="block font-black text-slate-950 transition group-hover:text-white">
                      Privacy Policy
                    </span>
                    <span className="mt-0.5 block text-xs font-semibold text-slate-500 transition group-hover:text-white/65">
                      Learn how your information is handled.
                    </span>
                  </span>
                </span>

                <FiChevronRight className="shrink-0 text-slate-400 transition group-hover:text-white" />
              </Link>

              <Link
                href="/terms-conditions"
                className="group flex items-center justify-between gap-3 rounded-[4px] border border-slate-200 bg-white px-4 py-3 text-sm transition hover:border-slate-950 hover:bg-slate-950"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[4px] bg-slate-100 text-slate-700 transition group-hover:bg-white group-hover:text-slate-950">
                    <FiFileText />
                  </span>

                  <span className="min-w-0">
                    <span className="block font-black text-slate-950 transition group-hover:text-white">
                      Terms & Conditions
                    </span>
                    <span className="mt-0.5 block text-xs font-semibold text-slate-500 transition group-hover:text-white/65">
                      Read shopping and account usage terms.
                    </span>
                  </span>
                </span>

                <FiChevronRight className="shrink-0 text-slate-400 transition group-hover:text-white" />
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[4px] border border-red-200 bg-red-50 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[4px] bg-white text-lg text-red-600 ring-1 ring-red-200">
                <FiLogOut />
              </span>

              <div>
                <p className="text-sm font-black text-red-700">
                  Logout from this account
                </p>
                <p className="mt-1 text-sm font-semibold leading-6 text-red-600">
                  You will need to verify OTP again to access your account.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLogoutOpen(true)}
              className="h-10 rounded-[4px] bg-red-600 px-4 text-sm font-black text-white transition hover:bg-red-700 active:scale-[0.99]"
            >
              Logout
            </button>
          </div>
        </section>
      </div>

      {logoutOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <div className="w-full max-w-md overflow-hidden rounded-[4px] border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[4px] bg-red-50 text-lg text-red-600 ring-1 ring-red-200">
                  <FiAlertTriangle />
                </span>

                <div>
                  <h3 className="text-base font-black text-slate-950">
                    Logout account?
                  </h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                    This will remove your current login session from this device.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLogoutOpen(false)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-[4px] border border-slate-200 text-slate-600 transition hover:bg-slate-950 hover:text-white"
                aria-label="Close logout confirmation"
              >
                <FiX />
              </button>
            </div>

            <div className="flex flex-col-reverse gap-2 px-4 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setLogoutOpen(false)}
                className="h-10 rounded-[4px] border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="h-10 rounded-[4px] bg-red-600 px-4 text-sm font-black text-white transition hover:bg-red-700 active:scale-[0.99]"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}