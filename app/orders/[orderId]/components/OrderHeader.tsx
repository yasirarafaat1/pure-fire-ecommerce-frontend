"use client";

import { FiCheck, FiCopy } from "react-icons/fi";

type Props = {
  orderId: string;
  created?: string;
  copiedKey: "order" | "txn" | null;
  onCopy: (value: string, key: "order" | "txn") => void;
};

export default function OrderHeader({ orderId, created, copiedKey, onCopy }: Props) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="grid gap-1">
        <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Order details</div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Order #{orderId}</h1>
          {orderId && (
            <button
              type="button"
              className="px-2 py-1 cursor-pointer text-[var(--muted)] rounded border border-[var(--muted)] hover:bg-[var(--muted)] hover:text-white transition-colors"
              onClick={() => onCopy(orderId, "order")}
              aria-label="Copy order id"
            >
              {copiedKey === "order" ? <FiCheck size={15} /> : <FiCopy size={15} />}
            </button>
          )}
        </div>
        {created && <div className="text-sm text-[var(--muted)]">Placed on {created}</div>}
      </div>
      <a href="/orders" className="btn btn-ghost px-3 py-2">
        Back
      </a>
    </div>
  );
}
