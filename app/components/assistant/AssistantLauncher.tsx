"use client";

import { MessageCircle, X } from "lucide-react";

export default function AssistantLauncher({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-assistant-launcher="true"
      aria-label={open ? "Close shopping assistant" : "Open shopping assistant"}
      onClick={onClick}
      className={`assistant-launcher-button fixed bottom-5 right-4 z-[45] h-14 w-14 place-items-center rounded-full bg-slate-950 text-white shadow-[0_18px_45px_rgba(15,23,42,0.28)] transition hover:bg-amber-400 hover:text-slate-950 active:scale-95 md:bottom-2 md:right-4 ${
        open ? "hidden md:grid" : "grid"
      }`}
    >
      {open ? <X size={22} /> : <MessageCircle size={23} />}
    </button>
  );
}
