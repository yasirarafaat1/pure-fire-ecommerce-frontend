"use client";

import { FiCheck, FiCopy } from "react-icons/fi";

type Props = {
  txnId: string;
  paymentStatus?: string;
  paymentMethod?: string;
  copiedKey: "order" | "txn" | null;
  onCopy: (value: string, key: "order" | "txn") => void;
};

export default function PaymentMeta({
  txnId,
  paymentStatus,
  paymentMethod,
  copiedKey,
  onCopy,
}: Props) {
  return (
    <div className="border-b border-t border-black/15 p-5 grid gap-3">
      <div className="grid gap-2 text-sm sm:hidden">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Transaction ID</span>
          <span className="flex items-center gap-2 text-[var(--muted)]">
            {txnId || "Pending"}
            {txnId && (
              <button
                type="button"
                className="px-2 py-1 cursor-pointer text-[var(--muted)] rounded border border-[var(--muted)] hover:bg-[var(--muted)] hover:text-white transition-colors"
                onClick={() => onCopy(txnId, "txn")}
                aria-label="Copy transaction id"
              >
                {copiedKey === "txn" ? <FiCheck size={15} /> : <FiCopy size={15} />}
              </button>
            )}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold">Payment</span>
          <span>{paymentStatus || "Pending"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold">Method</span>
          <span>{paymentMethod || "Razorpay"}</span>
        </div>
      </div>

      <div className="hidden sm:flex flex-wrap items-center gap-3 text-sm">
        <span className="font-semibold">Transaction ID</span>
        <span className="flex items-center gap-2 text-[var(--muted)]">
          {txnId || "Pending"}
          {txnId && (
            <button
              type="button"
              className="px-2 py-1 cursor-pointer text-[var(--muted)] rounded border border-[var(--muted)] hover:bg-[var(--muted)] hover:text-white transition-colors"
              onClick={() => onCopy(txnId, "txn")}
              aria-label="Copy transaction id"
            >
              {copiedKey === "txn" ? <FiCheck size={15} /> : <FiCopy size={15} />}
            </button>
          )}
        </span>
        <span className="text-[var(--muted)]">|</span>
        <span className="font-semibold">Payment</span>
        <span>{paymentStatus || "Pending"}</span>
        <span className="text-[var(--muted)]">|</span>
        <span className="font-semibold">Method</span>
        <span>{paymentMethod || "Razorpay"}</span>
      </div>
    </div>
  );
}
