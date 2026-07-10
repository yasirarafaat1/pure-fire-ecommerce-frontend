"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AddressList from "./components/AddressList";
import CheckoutPayment from "./components/CheckoutPayment";
import AddressPanel from "../profile/components/addresses/AddressPanel";
import { AddressItem, AddressPayload } from "../profile/components/addresses/types";
import { getUserEmail, getUserToken } from "../utils/auth";

const API_BASE = "/api/user";

type Address = Partial<AddressItem> & { id?: string | number };

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

type CheckoutPromo = {
  code: string;
  description?: string;
  discountAmount: number;
  totalAfterDiscount?: number;
  message?: string;
};

const promoStorageKey = "purefire_checkout_promo";

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
  const [checkoutPromo, setCheckoutPromo] = useState<CheckoutPromo | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

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
        const preferredAddressId = localStorage.getItem("checkout_selected_address_id") || "";
        setAddresses(addrList);
        if (addrList.length) {
          const preferred = preferredAddressId
            ? addrList.find((row: Address) => String(row.address_id || row.id) === String(preferredAddressId))
            : null;
          const fallbackAddressId = preferred
            ? preferred.address_id || preferred.id || null
            : addrList[0].address_id || addrList[0].id;
          setSelectedAddress((current) =>
            current || fallbackAddressId,
          );
        }
        if (buyNowItem) {
          setIsBuyNow(true);
          setCartItems([buyNowItem]);
        } else {
          setIsBuyNow(false);
          setCartItems(cartJson.items || []);
        }
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : "Failed to load checkout data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authReady]);

  const validatePromo = useCallback(
    async (code: string, silent = false) => {
      const normalized = code.trim().toUpperCase();
      if (!normalized) {
        setPromoMessage("Enter a promo code first.");
        return null;
      }
      if (!cartItems.length) return null;

      setPromoLoading(true);
      if (!silent) setPromoMessage("");
      try {
        const response = await fetch(`${API_BASE}/validate-promo`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-token": getUserToken(),
          },
          body: JSON.stringify({
            code: normalized,
            items: cartItems.map((item) => ({
              product_id: item.product_id,
              quantity: item.qty || item.quantity || 1,
              price: item.price || 0,
              color: item.color || "",
              size: item.size || "",
            })),
          }),
        });
        const data = await response.json();
        if (!response.ok || !data.status) {
          localStorage.removeItem(promoStorageKey);
          setCheckoutPromo(null);
          setPromoMessage(data.message || "Promo code is not applicable.");
          return;
        }
        const nextPromo = {
          code: data.promo?.code || normalized,
          description: data.promo?.description || "",
          discountAmount: Number(data.discountAmount || 0),
          totalAfterDiscount: Number(data.totalAfterDiscount || 0),
          message: data.message || "",
        };
        setCheckoutPromo(nextPromo);
        setPromoCode(nextPromo.code);
        setPromoMessage(data.message || "Promo applied successfully.");
        localStorage.setItem(promoStorageKey, JSON.stringify(nextPromo));
        return nextPromo;
      } catch {
        setCheckoutPromo(null);
        if (!silent) setPromoMessage("Promo validation failed.");
        return null;
      } finally {
        setPromoLoading(false);
      }
    },
    [cartItems],
  );

  useEffect(() => {
    if (!authReady || !cartItems.length) return;

    const raw = localStorage.getItem(promoStorageKey);
    if (!raw) {
      setCheckoutPromo(null);
      return;
    }

    try {
      const saved = JSON.parse(raw) as CheckoutPromo;
      if (saved?.code) void validatePromo(saved.code, true);
    } catch {
      localStorage.removeItem(promoStorageKey);
    }
  }, [authReady, cartItems.length, validatePromo]);

  const removePromo = () => {
    localStorage.removeItem(promoStorageKey);
    setCheckoutPromo(null);
    setPromoCode("");
    setPromoMessage("Promo removed.");
  };

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
    } catch (error: unknown) {
      return { ok: false, message: error instanceof Error ? error.message : "Failed to save address" };
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

  const handlePaymentError = (
    message: string,
    meta?: { failedPage?: boolean; orderId?: string | number },
  ) => {
    if (!meta?.failedPage) {
      setError(message);
      return;
    }

    const params = new URLSearchParams();
    if (meta.orderId) params.set("order_id", String(meta.orderId));
    if (message) params.set("reason", message);

    router.replace(`/order-failed${params.toString() ? `?${params.toString()}` : ""}`);
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
          <Link href="/" className="btn btn-ghost mt-4">Continue shopping</Link>
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
            onError={handlePaymentError}
            onSuccess={(orderId) => router.replace(`/order-success?order_id=${orderId}`)}
            mode={isBuyNow ? "buy_now" : "cart"}
            promo={checkoutPromo}
            promoCode={promoCode}
            promoMessage={promoMessage}
            promoLoading={promoLoading}
            onPromoCodeChange={(value) => setPromoCode(value.toUpperCase())}
            onApplyPromo={() => validatePromo(promoCode)}
            onRemovePromo={removePromo}
          />
        </aside>
      </div>

      <AddressPanel
        open={panelOpen}
        mode={panelMode}
        address={panelAddress as AddressItem | null}
        email={getUserEmail()}
        onClose={() => setPanelOpen(false)}
        onSave={handleSaveAddress}
      />
    </main>
  );
}
