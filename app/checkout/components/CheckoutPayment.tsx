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
  onError: (message: string, meta?: { failedPage?: boolean; orderId?: string | number }) => void;
  mode?: "cart" | "buy_now";
  promo?: {
    code: string;
    discountAmount: number;
    message?: string;
  } | null;
  promoCode: string;
  promoMessage: string;
  promoLoading: boolean;
  onPromoCodeChange: (value: string) => void;
  onApplyPromo: () => void;
  onRemovePromo: () => void;
};

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayFailureResponse = {
  error?: {
    description?: string;
    reason?: string;
    metadata?: {
      order_id?: string;
      payment_id?: string;
    };
  };
};

type RazorpayInstance = {
  open: () => void;
  on?: (event: "payment.failed", handler: (response: RazorpayFailureResponse) => void) => void;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

const getRazorpay = () => (window as Window & { Razorpay?: RazorpayConstructor }).Razorpay;

const loadRazorpay = () =>
  new Promise<boolean>((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (getRazorpay()) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function CheckoutPayment({
  items,
  selectedAddress,
  onSuccess,
  onError,
  mode = "cart",
  promo,
  promoCode,
  promoMessage,
  promoLoading,
  onPromoCodeChange,
  onApplyPromo,
  onRemovePromo,
}: Props) {
  const [paying, setPaying] = useState(false);

  const failToPage = (message: string, orderId?: string | number) => {
    onError(message, { failedPage: true, orderId });
    setPaying(false);
  };

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
          promo_code: promo?.code || "",
        }),
      });
      const orderJson = await orderRes.json();
      if (!orderRes.ok || !orderJson.status) {
        failToPage(orderJson.message || "Failed to create order", orderJson.local_order_id);
        return;
      }

      const ready = await loadRazorpay();
      if (!ready) {
        failToPage("Razorpay SDK failed to load", orderJson.local_order_id);
        return;
      }

      const options = {
        key: orderJson.key,
        amount: orderJson.amount,
        currency: orderJson.currency,
        name: "Pure Fire",
        description: "Order payment",
        order_id: orderJson.order?.id,
        prefill: { email: getUserEmail() },
        handler: async (response: RazorpayResponse) => {
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
            localStorage.removeItem("checkout_selected_address_id");
            localStorage.removeItem("checkout_started_from_assistant");
            localStorage.removeItem("purefire_checkout_promo");
            onSuccess(verifyJson.order_id || orderJson.local_order_id);
          } else {
            failToPage(
              verifyJson?.message || "Payment failed: verification was not confirmed.",
              verifyJson?.order_id || orderJson.local_order_id,
            );
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
        theme: { color: "#000000" },
      };

      const Razorpay = getRazorpay();
      if (!Razorpay) {
        failToPage("Razorpay checkout unavailable", orderJson.local_order_id);
        return;
      }
      const rzp = new Razorpay(options);
      rzp.on?.("payment.failed", (response) => {
        failToPage(
          response.error?.description || response.error?.reason || "Payment failed. Please try again.",
          orderJson.local_order_id || response.error?.metadata?.order_id,
        );
      });
      rzp.open();
    } catch (err: unknown) {
      failToPage(err instanceof Error ? err.message : "Payment failed");
    }
  };

  return (
    <OrderSummary
      items={items}
      onPay={handlePay}
      paying={paying}
      disabled={!selectedAddress}
      promo={promo}
      promoCode={promoCode}
      promoMessage={promoMessage}
      promoLoading={promoLoading}
      onPromoCodeChange={onPromoCodeChange}
      onApplyPromo={onApplyPromo}
      onRemovePromo={onRemovePromo}
    />
  );
}
