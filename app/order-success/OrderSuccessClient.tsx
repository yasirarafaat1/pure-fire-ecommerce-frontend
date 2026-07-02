"use client";

import { Cuboid, ShoppingBag } from "lucide-react";
import Link from "next/link";
import LottieAnimation from "../components/LottieAnimation";

const formatOrderId = (value?: string) => {
  if (!value) return "";
  if (/^\d+$/.test(value)) return value.padStart(6, "0");
  return value;
};

export default function OrderSuccessClient({ orderIdRaw = "" }: { orderIdRaw?: string }) {
  const orderId = formatOrderId(orderIdRaw);
  const orderHref = orderIdRaw ? `/orders/${orderIdRaw}` : "/orders";

  return (
    <main className="min-h-[70vh] flex items-center justify-center bg-white text-black px-4 py-10 md:py-7 md:px-5">
      <div className="w-full max-w-md border border-black/20 rounded-[6px] p-6 text-center grid gap-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="mx-auto grid h-44 w-44 place-items-center sm:h-52 sm:w-52">
          <LottieAnimation
            src="/lottie/order-success.json"
            label="Order success animation"
            className="h-full w-full"
            loop
            color="#16a34a"
          />
        </div>

        <div className="text-2xl font-semibold">Order Placed Successfully</div>
        <p className="text-sm text-[var(--muted)]">
          Thank you for your order. Your payment has been confirmed.
        </p>
        {orderId ? (
          <div className="text-sm">
            Order ID: <span className="font-semibold">#{orderId}</span>
          </div>
        ) : null}
        <div className="grid gap-2 mt-2">
          <Link href="/" className="btn btn-primary">
            <ShoppingBag /> Continue Shopping
          </Link>
          <Link href={orderHref} className="btn btn-ghost">
            <Cuboid /> View Order
          </Link>
        </div>
      </div>
    </main>
  );
}
