"use client";

import type { AddressAssistantCard } from "../types";

export default function AddressCard({ card }: { card: AddressAssistantCard }) {
  return (
    <div className="rounded-[5px] border border-black/10 bg-white p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold">{card.title}</span>
        {card.isDefault && <span className="rounded-[5px] bg-slate-100 px-2 py-1 text-[10px] font-bold">Default</span>}
      </div>
      <p className="mt-2 text-xs text-[var(--muted)]">{card.maskedAddress}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">
        {[card.city, card.state, card.pincode].filter(Boolean).join(", ")}
      </p>
    </div>
  );
}
