"use client";

import Link from "next/link";
import { Heart, Home, PackageCheck, ShoppingCart } from "lucide-react";
import type { CountSummaryAssistantCard } from "../types";

const countItems = [
  { key: "cart", label: "Cart", icon: ShoppingCart },
  { key: "wishlist", label: "Wishlist", icon: Heart },
  { key: "orders", label: "Orders", icon: PackageCheck },
  { key: "addresses", label: "Addresses", icon: Home },
] as const;

export default function CountSummaryCard({ card }: { card: CountSummaryAssistantCard }) {
  const visibleItems = countItems.filter((item) =>
    Object.prototype.hasOwnProperty.call(card.counts, item.key),
  );

  return (
    <div className="rounded-[7px] border border-black/10 bg-white p-3 shadow-sm">
      <p className="text-sm font-black text-slate-950">{card.title}</p>
      <div className={`mt-3 grid gap-2 ${visibleItems.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.key} className="rounded-[7px] border border-black/10 bg-slate-50 p-2">
              <div className="flex items-center gap-2 text-slate-500">
                <Icon size={14} />
                <span className="text-[11px] font-black uppercase tracking-[0.06em]">{item.label}</span>
              </div>
              <p className="mt-2 text-xl font-black leading-none text-slate-950">
                {Number(card.counts[item.key] || 0)}
              </p>
            </div>
          );
        })}
      </div>

      {card.actions?.length ? (
        <div className="mt-3 grid gap-2 sm:flex sm:flex-wrap">
          {card.actions.slice(0, 4).map((action) =>
            action.type === "link" ? (
              <Link key={`${action.label}-${action.href}`} href={action.href} className="summary-link">
                {action.label}
              </Link>
            ) : null,
          )}
        </div>
      ) : null}

      <style jsx>{`
        .summary-link {
          display: inline-flex;
          min-height: 36px;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          border: 1px solid rgba(15, 23, 42, 0.1);
          background: #ffffff;
          padding: 8px 10px;
          font-size: 12px;
          font-weight: 900;
          color: #0f172a;
          text-decoration: none;
          transition:
            transform 160ms ease,
            background 160ms ease,
            color 160ms ease,
            border-color 160ms ease;
        }

        .summary-link:hover {
          transform: translateY(-1px);
          border-color: #020617;
          background: #020617;
          color: #ffffff;
        }
      `}</style>
    </div>
  );
}
