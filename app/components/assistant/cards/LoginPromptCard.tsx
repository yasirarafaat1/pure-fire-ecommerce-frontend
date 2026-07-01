"use client";

import Link from "next/link";
import type { LoginPromptAssistantCard } from "../types";

export default function LoginPromptCard({ card }: { card: LoginPromptAssistantCard }) {
  return (
    <div className="rounded-[5px] border border-black/10 bg-white p-3">
      <div className="text-sm font-bold">{card.title}</div>
      <p className="mt-1 text-xs text-[var(--muted)]">{card.message}</p>
      <Link href={card.action.href} className="btn btn-primary mt-3 w-full py-2 text-xs">
        {card.action.label}
      </Link>
    </div>
  );
}
