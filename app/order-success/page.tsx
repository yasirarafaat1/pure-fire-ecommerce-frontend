"use client";

import { useSearchParams } from "next/navigation";

export default function OrderSuccessPage() {
  const params = useSearchParams();
  const orderId = params.get("order_id");

  return (
    <main className="min-h-[70vh] flex items-center justify-center bg-white text-black px-4 py-10">
      <div className="w-full max-w-md border border-black/20 rounded-[5px] p-6 text-center grid gap-3">
        <div className="text-2xl font-semibold">Payment Successful</div>
        <p className="text-sm text-[var(--muted)]">
          Thank you for your order. Your payment has been confirmed.
        </p>
        {orderId && (
          <div className="text-sm">
            Order ID: <span className="font-semibold">{orderId}</span>
          </div>
        )}
        <div className="grid gap-2 mt-2">
          <a href="/" className="btn btn-primary">Continue shopping</a>
          <a href="/profile" className="btn btn-ghost">View orders</a>
        </div>
      </div>
    </main>
  );
}
