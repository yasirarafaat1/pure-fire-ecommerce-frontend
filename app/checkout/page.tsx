"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AddressList from "./components/AddressList";
import CheckoutPayment from "./components/CheckoutPayment";
import AddressPanel from "../profile/components/addresses/AddressPanel";
import { AddressPayload } from "../profile/components/addresses/types";
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

export default function CheckoutPage() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | number | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isBuyNow, setIsBuyNow] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"add" | "edit">("add");
  const [panelAddress, setPanelAddress] = useState<Address | null>(null);

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
        const rawBuyNow = localStorage.getItem("buy_now_item");
        let buyNowItem: CartItem | null = null;
        if (rawBuyNow) {
          try {
            const parsed = JSON.parse(rawBuyNow);
            if (parsed?.product_id) buyNowItem = parsed;
          } catch {
            buyNowItem = null;
          }
        }
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
        if (buyNowItem) {
          setIsBuyNow(true);
          setCartItems([buyNowItem]);
        } else {
          setIsBuyNow(false);
          setCartItems(cartJson.items || []);
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load checkout data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authReady]);

  const refreshAddresses = async () => {
    const addrRes = await fetch(`${API_BASE}/get-user-addresess`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-token": getUserToken(),
      },
      body: JSON.stringify({ email: getUserEmail() }),
    });
    const addrJson = addrRes.ok ? await addrRes.json() : { addresses: [] };
    const addrList = addrJson.addresses || addrJson.data || [];
    setAddresses(addrList);
    return addrList;
  };

  const handleSaveAddress = async (payload: AddressPayload, id?: string | number | null) => {
    try {
      const url = id ? `${API_BASE}/update-user-address` : `${API_BASE}/create-newAddress`;
      const method = id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-user-token": getUserToken(),
        },
        body: JSON.stringify({ ...payload, address_id: id, email: getUserEmail() }),
      });
      const data = await res.json();
      if (!res.ok || !data.status) {
        return { ok: false, message: data.message || "Failed to save address" };
      }
      const list = await refreshAddresses();
      const savedId = data.address?.address_id || data.data?.address_id || id;
      if (savedId) setSelectedAddress(savedId);
      if (!savedId && list.length) {
        setSelectedAddress(list[0].address_id || list[0].id);
      }
      return { ok: true };
    } catch (err: any) {
      return { ok: false, message: err.message || "Failed to save address" };
    }
  };

  const openAdd = () => {
    setPanelMode("add");
    setPanelAddress(null);
    setPanelOpen(true);
  };

  const openEdit = () => {
    if (!selectedAddress) return;
    const hit = addresses.find((a) => String(a.address_id || a.id) === String(selectedAddress));
    if (!hit) return;
    setPanelMode("edit");
    setPanelAddress(hit);
    setPanelOpen(true);
  };

  if (!authReady || loading) {
    return (
      <main className="max-w-6xl mx-auto p-4 md:p-6">
             <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full border-2 border-black/20 border-t-black animate-spin" />
            <div className="text-xs uppercase tracking-[0.3em] text-black/70">Loading Checkout...</div>
          </div>
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
          <div className="flex gap-2">
            <button className="btn btn-ghost" type="button" onClick={openAdd}>
              + Add New
            </button>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <AddressList
            addresses={addresses}
            selectedId={selectedAddress}
            onSelect={setSelectedAddress}
            onEdit={openEdit}
          />
        </section>

        <aside className="md:sticky md:top-24">
          <CheckoutPayment
            items={cartItems}
            selectedAddress={selectedAddress}
            onError={setError}
            onSuccess={(orderId) => router.replace(`/order-success?order_id=${orderId}`)}
            mode={isBuyNow ? "buy_now" : "cart"}
          />
        </aside>
      </div>

      <AddressPanel
        open={panelOpen}
        mode={panelMode}
        address={panelAddress as any}
        email={getUserEmail()}
        onClose={() => setPanelOpen(false)}
        onSave={handleSaveAddress}
      />
    </main>
  );
}
