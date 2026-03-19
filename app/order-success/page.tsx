"use client";

import { useSearchParams } from "next/navigation";

const formatOrderId = (value: string | null) => {
  if (!value) return "";
  if (/^\d+$/.test(value)) return value.padStart(6, "0");
  return value;
};

export default function OrderSuccessPage() {
  const params = useSearchParams();
  const orderIdRaw = params.get("order_id");
  const orderId = formatOrderId(orderIdRaw);

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
          <a href={`/orders/${orderIdRaw || ""}`} className="btn btn-ghost">View order</a>
        </div>
      </div>
    </main>
  );
}





