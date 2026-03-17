"use client";

import { useRouter } from "next/navigation";
import { writeCookie } from "../../utils/auth";

export default function LogoutSection({ onCancel }: { onCancel: () => void }) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("user_token");
    localStorage.removeItem("user_email");
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem("user_token");
      sessionStorage.removeItem("user_email");
    }
    writeCookie("user_token", "", -1);
    writeCookie("user_email", "", -1);
    window.dispatchEvent(new Event("wishlist:updated"));
    window.dispatchEvent(new Event("cart:updated"));
    router.replace("/login");
  };

  return (
    <div className="grid gap-3">
      <p className="text-sm text-[var(--muted)]">Are you sure you want to logout?</p>
      <div className="flex gap-2">
        <button className="btn btn-primary" onClick={handleLogout}>
          Logout
        </button>
        <button className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
