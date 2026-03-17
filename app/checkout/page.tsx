"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AddressList from "./components/AddressList";
import OrderSummary from "./components/OrderSummary";
import { getUserEmail, getUserToken } from "../utils/auth";

const API_BASE = "/api/user";

type Address = {
  id?: string | number;
  address_id?: number | string;
  FullName?: string;
  phone1?: string;
  phone2?: string;
  email?: string;
  country?: string;
  state?: string;
  city?: string;
  district?: string;
  pinCode?: string;
  address?: string;
  address_line2?: string;
  addressType?: string;
};

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

export default function CheckoutPage() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | number | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getUserToken();
    if (!token) {
      router.replace("/login?next=/checkout");
      return;
    }
    setAuthReady(true);
  }, [router]);

  useEffect(() => {
    if (!authReady) return;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [addrRes, cartRes] = await Promise.all([
          fetch(`${API_BASE}/get-user-addresess`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-token": getUserToken(),
            },
            body: JSON.stringify({ email: getUserEmail() }),
          }),
          fetch(`${API_BASE}/get-user-cart`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cart_id: localStorage.getItem("cart_id") || "" }),
          }),
        ]);
        const addrJson = addrRes.ok ? await addrRes.json() : { addresses: [] };
        const cartJson = cartRes.ok ? await cartRes.json() : { items: [] };
        const addrList = addrJson.addresses || addrJson.data || [];
        setAddresses(addrList);
        if (addrList.length && !selectedAddress) {
          setSelectedAddress(addrList[0].address_id || addrList[0].id);
        }
        setCartItems(cartJson.items || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load checkout data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authReady]);

  const handlePay = async () => {
    if (!selectedAddress) {
      setError("Please select an address.");
      return;
    }
    if (!cartItems.length) {
      setError("Your cart is empty.");
      return;
    }
    setPaying(true);
    setError("");
    try {
      const itemsPayload = cartItems.map((i) => ({
        product_id: i.product_id,
        quantity: i.qty || i.quantity || 1,
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
        description: "Order भुगतान",
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
            const cartId = localStorage.getItem("cart_id") || "";
            if (cartId) {
              await fetch(`${API_BASE}/clear-cart`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cart_id: cartId }),
              });
            }
            router.replace(`/order-success?order_id=${verifyJson.order_id || orderJson.local_order_id}`);
          } else {
            setError("Payment verification failed.");
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
      setError(err.message || "Payment failed");
      setPaying(false);
    }
  };

  if (!authReady || loading) {
    return (
      <main className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-center py-16 text-sm text-[var(--muted)]">
          Loading...
        </div>
      </main>
    );
  }

  if (!cartItems.length) {
    return (
      <main className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="border border-black/20 rounded-[5px] p-10 text-center">
          <p className="text-sm text-[var(--muted)]">Your cart is empty.</p>
          <a href="/" className="btn btn-ghost mt-4">Continue shopping</a>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="grid gap-6 md:grid-cols-[1.6fr_1fr] items-start">
        <section className="grid gap-4">
          <div>
            <h1 className="text-xl font-semibold">Checkout</h1>
            <p className="text-sm text-[var(--muted)]">Select a delivery address.</p>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <AddressList
            addresses={addresses}
            selectedId={selectedAddress}
            onSelect={setSelectedAddress}
          />
        </section>

        <aside className="md:sticky md:top-24">
          <OrderSummary
            items={cartItems}
            onPay={handlePay}
            paying={paying}
            disabled={!selectedAddress}
          />
        </aside>
      </div>
    </main>
  );
}
