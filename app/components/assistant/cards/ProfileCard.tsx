"use client";

import Link from "next/link";
import type { ProfileAssistantCard } from "../types";

export default function ProfileCard({ card }: { card: ProfileAssistantCard }) {
  return (
    <div className="rounded-[5px] border border-black/10 bg-white p-3 text-sm">
      <div className="font-bold">{card.name}</div>
      {card.emailMasked && <div className="mt-1 text-xs text-[var(--muted)]">{card.emailMasked}</div>}
      {card.phoneMasked && <div className="text-xs text-[var(--muted)]">{card.phoneMasked}</div>}
      <Link href="/profile" className="btn btn-ghost mt-3 w-full py-2 text-xs">
        Open Profile
      </Link>
    </div>
  );
}
