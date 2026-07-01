"use client";

import { useRouter } from "next/navigation";
import { clearUserAuth } from "../../utils/auth";

export default function SettingsSection({ email }: { email: string }) {
  const router = useRouter();
  const handleLogout = () => {
    clearUserAuth();
    window.dispatchEvent(new Event("wishlist:updated"));
    window.dispatchEvent(new Event("cart:updated"));
    window.dispatchEvent(new Event("auth:changed"));
    router.replace("/login");
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <p className="text-sm text-[var(--muted)]">Registered Email</p>
        <div className="border border-black/15 rounded-[5px] p-3 text-sm">{email || "-"}</div>
      </div>
      <div className="grid gap-2">
        <a href="/privacy-policy" className="border border-black/15 rounded-[5px] p-3 text-sm underline underline-offset-4">
          Privacy Policy
        </a>
        <a href="/terms-conditions" className="border border-black/15 rounded-[5px] p-3 text-sm underline underline-offset-4">
          Terms & Conditions
        </a>
      </div>
      <div className="grid gap-2">
        <button className="btn btn-primary w-fit" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
