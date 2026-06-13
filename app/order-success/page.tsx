"use client";

import { Cuboid, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const formatOrderId = (value: string | null) => {
  if (!value) return "";
  if (/^\d+$/.test(value)) return value.padStart(6, "0");
  return value;
};

export default function OrderSuccessPage() {
  const [orderIdRaw] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("order_id");
  });

  const orderId = formatOrderId(orderIdRaw);

  return (
    <main className="min-h-[70vh] flex items-center justify-center bg-white text-black px-4 py-10 md:py-0 md:px-0">
      <div className="w-full max-w-md border border-black/20 rounded-[5px] p-6 text-center grid gap-4">
        <div className="mx-auto w-full max-w-[260px]">
          <div className="relative mx-auto h-40 w-full sm:h-52">
            <Image
              src="/order.svg"
              alt="Order success illustration"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
        <div className="text-2xl font-semibold">Order Placed Successfully</div>
        <p className="text-sm text-[var(--muted)]">
          Thank you for your order. Your payment has been confirmed.
        </p>
        {orderId && (
          <div className="text-sm">
            Order ID: <span className="font-semibold">#{orderId}</span>
          </div>
        )}
        <div className="grid gap-2 mt-2">
          <Link href="/" className="btn btn-primary"> <ShoppingBag /> Continue Shopping</Link>
          <Link href={`/orders/${orderIdRaw || ""}`} className="btn btn-ghost"> <Cuboid /> View Order</Link>
        </div>
      </div>
    </main>
  );
}





