"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { clearUserAuth } from "../../../utils/auth";
import type { LogoutConfirmAssistantCard } from "../types";

export default function LogoutConfirmCard({ card }: { card: LogoutConfirmAssistantCard }) {
  const [done, setDone] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const confirmLogout = () => {
    clearUserAuth();
    window.dispatchEvent(new Event("auth:changed"));
    setDone(true);
    setCancelled(false);
  };

  return (
    <div className="rounded-[7px] border border-black/10 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-2">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-950 text-white">
          <LogOut size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-950">{card.title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
            {done ? "Logged out successfully." : cancelled ? "Logout cancelled." : card.message}
          </p>
        </div>
      </div>

      {!done && !cancelled ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={confirmLogout} className="assistant-logout-primary">
            {card.confirmLabel}
          </button>
          <button type="button" onClick={() => setCancelled(true)} className="assistant-logout-secondary">
            {card.cancelLabel}
          </button>
        </div>
      ) : null}

      <style jsx>{`
        .assistant-logout-primary,
        .assistant-logout-secondary {
          min-height: 38px;
          border-radius: 6px;
          padding: 0 12px;
          font-size: 12px;
          font-weight: 900;
          transition: transform 160ms ease;
        }

        .assistant-logout-primary {
          background: #020617;
          color: #ffffff;
        }

        .assistant-logout-secondary {
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: #ffffff;
          color: #0f172a;
        }

        .assistant-logout-primary:hover,
        .assistant-logout-secondary:hover {
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
