"use client";

import Link from "next/link";
import type { OrderAssistantCard as OrderCardType } from "../types";

const money = (value?: number) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function OrderAssistantCard({ card }: { card: OrderCardType }) {
  return (
    <div className="rounded-[5px] border border-black/10 bg-white p-3 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Order</div>
          <div className="font-bold">#{card.orderId}</div>
        </div>
        <span className="rounded-[5px] bg-slate-950 px-2 py-1 text-xs font-semibold text-white">
          {card.status}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--muted)]">
        <span>Payment: {card.paymentStatus || "pending"}</span>
        <span>Items: {card.itemCount || card.itemsPreview?.length || 0}</span>
        {!card.isLimited && <span>Total: {money(card.total)}</span>}
        {card.eta && <span>ETA: {card.eta}</span>}
      </div>
      {card.trackingUrl && (
        <a href={card.trackingUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-bold underline">
          Track shipment
        </a>
      )}
      {!card.isLimited && (
        <Link href={`/orders/${card.orderId}`} className="btn btn-ghost mt-3 w-full py-2 text-xs">
          View Order
        </Link>
      )}
    </div>
  );
}
