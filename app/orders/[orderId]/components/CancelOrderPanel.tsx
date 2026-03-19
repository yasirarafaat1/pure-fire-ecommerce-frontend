"use client";

import { useState } from "react";
import { getUserToken } from "../../../utils/auth";

const API_BASE = "/api/user";

type Props = {
  orderId: string;
  disabled?: boolean;
  onCancelled: (order: any) => void;
};

export default function CancelOrderPanel({ orderId, disabled, onCancelled }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submitCancel = async () => {
    if (!orderId || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/cancel-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-token": getUserToken(),
        },
        body: JSON.stringify({ order_id: orderId }),
      });
      const data = await res.json();
      if (!res.ok || !data.status) throw new Error(data.message || "Failed to cancel");
      onCancelled(data.order || { status: "cancelled", payment_status: "cancelled" });
      setOpen(false);
    } catch (err: any) {
      setError(err.message || "Unable to cancel right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-2">
      {!disabled && (
        <button
          type="button"
          className="text-[11px] text-[var(--muted)] pl-5 cursor-pointer hover:text-red-600 underline underline-offset-2 w-fit"
          onClick={() => setOpen(true)}
        >
          Need to cancel this order?
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
            aria-label="Close dialog"
          />
          <div className="relative bg-white border border-black/15 rounded-[5px] p-5 w-[90%] max-w-sm grid gap-3">
            <div className="text-sm font-semibold">Cancel order?</div>
            <div className="text-xs text-[var(--muted)]">
              This action cannot be undone. We will try to stop the shipment immediately.
            </div>
            {error && <div className="text-xs text-red-600">{error}</div>}
            <div className="flex items-center justify-end gap-2">
              <button type="button" className="btn btn-ghost px-3 py-2" onClick={() => setOpen(false)}>
                Keep order
              </button>
              <button
                type="button"
                className="px-3 py-2 border border-red-600 bg-red-600 cursor-pointer text-white rounded-[5px]"
                onClick={submitCancel}
                disabled={loading}
              >
                {loading ? "Cancelling..." : "Cancel order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
