"use client";

import { useState } from "react";
import OrderSummary from "./OrderSummary";
import { getUserEmail, getUserToken } from "../../utils/auth";

const API_BASE = "/api/user";

type CartItem = {
  product_id?: number | string;
  title?: string;
  qty?: number;
  quantity?: number;
  price?: number;
  mrp?: number;
  image?: string;
  color?: string;
  size?: string;
};

type Props = {
  items: CartItem[];
  selectedAddress: string | number | null;
  onSuccess: (orderId: string | number) => void;
  onError: (message: string) => void;
  mode?: "cart" | "buy_now";
};

const loadRazorpay = () =>
  new Promise<boolean>((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function CheckoutPayment({ items, selectedAddress, onSuccess, onError, mode = "cart" }: Props) {
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    if (!selectedAddress) {
      onError("Please select an address.");
      return;
    }
    if (!items.length) {
      onError("Your cart is empty.");
      return;
    }
    setPaying(true);
    onError("");
    try {
      const itemsPayload = items.map((i) => ({
        product_id: i.product_id,
        quantity: i.qty || i.quantity || 1,
        color: i.color || "",
        size: i.size || "",
      }));
      const orderRes = await fetch(`${API_BASE}/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-token": getUserToken(),
        },
        body: JSON.stringify({
          items: itemsPayload,
          address_id: selectedAddress,
          email: getUserEmail(),
        }),
      });
      const orderJson = await orderRes.json();
      if (!orderRes.ok || !orderJson.status) {
        throw new Error(orderJson.message || "Failed to create order");
      }

      const ready = await loadRazorpay();
      if (!ready) throw new Error("Razorpay SDK failed to load");

      const options = {
        key: orderJson.key,
        amount: orderJson.amount,
        currency: orderJson.currency,
        name: "Pure Fire",
        description: "Order payment",
        order_id: orderJson.order?.id,
        prefill: { email: getUserEmail() },
        handler: async (response: any) => {
          const verifyRes = await fetch(`${API_BASE}/payment-success`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const verifyJson = await verifyRes.json();
          if (verifyJson?.status) {
            if (mode === "cart") {
              const cartId = localStorage.getItem("cart_id") || "";
              if (cartId) {
                await fetch(`${API_BASE}/clear-cart`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ cart_id: cartId }),
                });
              }
            } else {
              localStorage.removeItem("buy_now_item");
            }
            onSuccess(verifyJson.order_id || orderJson.local_order_id);
          } else {
            onError("Payment verification failed.");
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
        theme: { color: "#000000" },
      } as any;

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      onError(err.message || "Payment failed");
      setPaying(false);
    }
  };

  return (
    <OrderSummary
      items={items}
      onPay={handlePay}
      paying={paying}
      disabled={!selectedAddress}
    />
  );
}
