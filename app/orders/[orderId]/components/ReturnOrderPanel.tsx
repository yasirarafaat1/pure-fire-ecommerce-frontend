"use client";

import { useState } from "react";
import { getUserToken } from "../../../utils/auth";

const API_BASE = "/api/user";

type Props = {
  orderId: string;
  disabled?: boolean;
  onReturned: (order: any) => void;
};

export default function ReturnOrderPanel({ orderId, disabled, onReturned }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submitReturn = async () => {
    if (!orderId || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/return-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-token": getUserToken(),
        },
        body: JSON.stringify({ order_id: orderId }),
      });
      const data = await res.json();
      if (!res.ok || !data.status) throw new Error(data.message || "Failed to request return");
      onReturned(data.order || { status: "return_requested" });
      setOpen(false);
    } catch (err: any) {
      setError(err.message || "Unable to request return.");
    } finally {
      setLoading(false);
    }
  };

  if (disabled) return null;

  return (
    <div className="grid gap-2">
      <button
        type="button"
        className="text-[11px] text-[var(--muted)] hover:text-black underline underline-offset-2 w-fit"
        onClick={() => setOpen(true)}
      >
        Request a return
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
            aria-label="Close dialog"
          />
          <div className="relative bg-white border border-black/15 rounded-[5px] p-5 w-[90%] max-w-sm grid gap-3">
            <div className="text-sm font-semibold">Request return?</div>
            <div className="text-xs text-[var(--muted)]">
              We will review this return request and update your order status.
            </div>
            {error && <div className="text-xs text-red-600">{error}</div>}
            <div className="flex items-center justify-end gap-2">
              <button type="button" className="btn btn-ghost px-3 py-2" onClick={() => setOpen(false)}>
                Keep order
              </button>
              <button
                type="button"
                className="px-3 py-2 border border-black text-black rounded-[5px]"
                onClick={submitReturn}
                disabled={loading}
              >
                {loading ? "Requesting..." : "Request return"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
