"use client";

import Link from "next/link";
import type { PolicyAssistantCard } from "../types";

export default function PolicyCard({ card }: { card: PolicyAssistantCard }) {
  const action = card.actions?.find((item) => item.type === "link");
  return (
    <div className="rounded-[5px] border border-black/10 bg-white p-3">
      <div className="text-sm font-bold">{card.title}</div>
      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{card.content}</p>
      {action?.type === "link" && (
        <Link href={action.href} className="btn btn-ghost mt-3 w-full py-2 text-xs">
          {action.label}
        </Link>
      )}
    </div>
  );
}
