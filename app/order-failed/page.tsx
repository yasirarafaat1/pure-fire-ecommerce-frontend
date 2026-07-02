"use client";

import { CreditCard, RotateCcw, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import LottieAnimation from "../components/LottieAnimation";

const formatOrderId = (value: string | null) => {
  if (!value) return "";
  if (/^\d+$/.test(value)) return value.padStart(6, "0");
  return value;
};

export default function OrderFailedPage() {
  const [params] = useState(() => {
    if (typeof window === "undefined") {
      return { orderId: "", reason: "" };
    }

    const searchParams = new URLSearchParams(window.location.search);
    const mock = searchParams.get("mock") === "1";

    return {
      orderId: searchParams.get("order_id") || (mock ? "987654" : ""),
      reason:
        searchParams.get("reason") ||
        (mock ? "Payment could not be verified by the gateway." : ""),
    };
  });

  const orderId = formatOrderId(params.orderId);

  return (
    <main className="min-h-[70vh] flex items-center justify-center bg-white text-black px-4 py-10 md:py-7 md:px-0">
      <div className="w-full max-w-md border border-black/20 rounded-[6px] p-6 text-center grid gap-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="mx-auto grid h-40 w-40 place-items-center sm:h-48 sm:w-48">
          <LottieAnimation
            src="/lottie/order-failed.json"
            label="Order failed animation"
            className="h-full w-full"
            loop
          />
        </div>

        <div className="text-2xl font-semibold">Payment Failed</div>

        <p className="text-sm text-[var(--muted)]">
          Your order was not confirmed because the payment did not complete.
        </p>

        {orderId ? (
          <div className="text-sm">
            Reference ID: <span className="font-semibold">#{orderId}</span>
          </div>
        ) : null}

        {params.reason ? (
          <div className="rounded-[5px] border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {params.reason}
          </div>
        ) : null}

        <div className="grid gap-2 mt-2">
          <Link href="/checkout" className="btn btn-primary">
            <RotateCcw /> Try Again
          </Link>
          <Link href="/support" className="btn btn-ghost">
            <CreditCard /> Payment Help
          </Link>
          <Link href="/" className="btn btn-ghost">
            <ShoppingBag /> Continue Shopping
          </Link>
          {!orderId ? (
            <Link href="/order-failed?order_id=987654&reason=Payment%20could%20not%20be%20verified%20by%20the%20gateway.&mock=1" className="text-xs font-bold text-[var(--muted)] underline-offset-4 hover:underline">
              View mock failed
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}
