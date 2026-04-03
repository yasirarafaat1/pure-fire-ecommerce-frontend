"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import namer from "color-namer";
import ProductRail from "../product/components/ProductRail";
import { getUserToken } from "../utils/auth";
import { buildProductHref } from "../utils/productUrl";

const API_BASE = "/api/user";
const getToken = () => getUserToken();

type CartItem = {
  id: string | number;
  title: string;
  subcategory?: string;
  price: number;
  mrp?: number;
  qty: number;
  image: string;
  images?: string[];
  color?: string;
  size?: string;
};

export default function CartPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState<CartItem[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [cartId, setCartId] = useState("");
  const [productMap, setProductMap] = useState<Record<string, any>>({});
  const [loadingCart, setLoadingCart] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [clearingCart, setClearingCart] = useState(false);

  const requireAuth = () => {
    const token = getToken();
    if (!token) {
      const next = pathname || "/cart";
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return false;
    }
    return true;
  };

  useEffect(() => {
    const stored = localStorage.getItem("cart_id") || "";
    setCartId(stored);
    if (!stored) setLoadingCart(false);
  }, []);

  useEffect(() => {
    if (!cartId) return;
    setLoadingCart(true);
    fetch(`${API_BASE}/get-user-cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-token": getToken() },
      body: JSON.stringify({ cart_id: cartId }),
    })
      .then((r) => r.json())
      .then((d) =>
        setItems(
          (d?.items || []).map((i: any) => ({
            id: i.product_id,
            title: i.title,
            subcategory: productMap[String(i.product_id)]?.title || "",
            price: i.price,
            mrp: i.mrp,
            qty: i.qty,
            image: i.image,
            color: i.color,
            size: i.size,
          })),
        ),
      )
      .catch(() => setItems([]))
      .finally(() => setLoadingCart(false));
  }, [cartId, productMap]);

  useEffect(() => {
    setLoadingRecent(true);
    fetch(`${API_BASE}/show-product`)
      .then((r) => r.json())
      .then((d) => {
        const list = d?.products || d?.data || [];
        setRecentlyViewed(list);
        const map: Record<string, any> = {};
        list.forEach((p: any) => {
          const pid = String(p.product_id || p._id || "");
          if (pid) map[pid] = p;
        });
        setProductMap(map);
      })
      .catch(() => setRecentlyViewed([]))
      .finally(() => setLoadingRecent(false));
  }, []);

  useEffect(() => {
    const loadWishlist = async () => {
      const email = (localStorage.getItem("user_email") || "guest@purefire.local").trim();
      localStorage.setItem("user_email", email);
      try {
        const res = await fetch(`${API_BASE}/wishlist/list`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-user-token": getToken() },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        const ids = new Set<string>(
          (data?.products || []).map((p: any) => String(p.product_id || p._id || "")),
        );
        setWishlistIds(ids);
      } catch {
        setWishlistIds(new Set<string>());
      }
    };
    loadWishlist();
    const onUpdated = () => loadWishlist();
    window.addEventListener("wishlist:updated", onUpdated as EventListener);
    return () => window.removeEventListener("wishlist:updated", onUpdated as EventListener);
  }, []);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const mrpTotal = items.reduce((sum, i) => sum + (i.mrp ?? i.price) * i.qty, 0);
    return { subtotal, mrpTotal };
  }, [items]);

  const colorNameFromHex = useMemo(
    () => (input: string) => {
      const raw = (input || "").trim();
      if (!raw) return "";
      const hex = raw.startsWith("#")
        ? raw
        : /^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(raw)
          ? `#${raw}`
          : "";
      if (hex) {
        try {
          const result = namer(hex);
          return result?.basic?.[0]?.name || result?.html?.[0]?.name || "Custom";
        } catch {
          return "Custom";
        }
      }
      return raw.replace(/\b\w/g, (c) => c.toUpperCase());
    },
    [],
  );

  const updateQty = async (item: CartItem, nextQty: number) => {
    if (!cartId) return;
    const res = await fetch(`${API_BASE}/update-cart-item`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-token": getToken() },
      body: JSON.stringify({
        cart_id: cartId,
        product_id: item.id,
        color: item.color || "",
        size: item.size || "",
        qty: nextQty,
      }),
    });
    const data = await res.json();
    if (data?.items) {
      setItems(
        data.items.map((i: any) => ({
          id: i.product_id,
          title: i.title,
          subcategory: productMap[String(i.product_id)]?.title || "",
          price: i.price,
          mrp: i.mrp,
          qty: i.qty,
          image: i.image,
          color: i.color,
          size: i.size,
        })),
      );
      window.dispatchEvent(new Event("cart:updated"));
    }
  };

  const removeItem = async (item: CartItem) => {
    if (!cartId) return;
    const qs = new URLSearchParams({
      cart_id: cartId,
      color: item.color || "",
      size: item.size || "",
    }).toString();
    const res = await fetch(`${API_BASE}/remove-cart-by-product/${item.id}?${qs}`);
    const data = await res.json();
    if (data?.items) {
      setItems(
        data.items.map((i: any) => ({
          id: i.product_id,
          title: i.title,
          subcategory: productMap[String(i.product_id)]?.title || "",
          price: i.price,
          mrp: i.mrp,
          qty: i.qty,
          image: i.image,
          color: i.color,
          size: i.size,
        })),
      );
      window.dispatchEvent(new Event("cart:updated"));
    }
  };

  const clearCart = async () => {
    if (!cartId || clearingCart) return;
    setClearingCart(true);
    try {
      const res = await fetch(`${API_BASE}/clear-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-token": getToken() },
        body: JSON.stringify({ cart_id: cartId }),
      });
      const data = await res.json();
      if (data?.items) {
        setItems(
          (data.items || []).map((i: any) => ({
            id: i.product_id,
            title: i.title,
            subcategory: productMap[String(i.product_id)]?.title || "",
            price: i.price,
            mrp: i.mrp,
            qty: i.qty,
            image: i.image,
            color: i.color,
            size: i.size,
          })),
        );
        window.dispatchEvent(new Event("cart:updated"));
      }
    } finally {
      setClearingCart(false);
    }
  };

  const toggleWishlist = async (item: CartItem) => {
    if (!requireAuth()) return;
    const email = (localStorage.getItem("user_email") || "guest@purefire.local").trim();
    localStorage.setItem("user_email", email);
    const isWishlisted = wishlistIds.has(String(item.id));
    const endpoint = isWishlisted ? "/wishlist/remove" : "/wishlist/add";
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-token": getToken() },
        body: JSON.stringify({ email, product_id: item.id }),
      });
      const data = await res.json();
      const ids = new Set<string>(
        (data?.products || []).map((p: any) => String(p.product_id || p._id || "")),
      );
      setWishlistIds(ids);
      window.dispatchEvent(new Event("wishlist:updated"));
    } catch {
      // ignore
    }
  };

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-6 grid gap-6 relative">
      {(loadingCart || loadingRecent) && (
        <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full border-2 border-black/20 border-t-black animate-spin" />
            <div className="text-sm font-semibold tracking-wide">Loading Cart…</div>
          </div>
        </div>
      )}
      <header className="flex items-start justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold">Shopping Cart</h1>
          <p className="text-sm text-[var(--muted)]">Review your items before checkout.</p>
        </div>
        {items.length > 0 && (
          <button
            className="btn btn-ghost px-3 py-2"
            onClick={clearCart}
            disabled={clearingCart}
          >
            {clearingCart ? "Clearing cart..." : "Clear cart"}
          </button>
        )}
      </header>

      <div className={`grid gap-6 items-start ${items.length ? "md:grid-cols-[1.5fr_0.5fr]" : ""}`}>
        <section className="bg-white">
          {items.length === 0 ? (
            <div className="grid gap-10 text-sm text-[var(--muted)] place-items-center text-center py-10">
              <p>Your cart is empty.</p>
              <a href="/" className="btn btn-ghost">
                Continue shopping
              </a>
            </div>
          ) : (
            <div className="grid gap-4">
              {items.map((item) => (
                <div key={`${item.id}-${item.color}-${item.size}`} className="flex gap-4 border-b border-black/20 pb-4">
                  <a
                    href={buildProductHref({
                      id: item.id,
                      name: item.title,
                      color: item.color,
                      size: item.size,
                    })}
                  >
                    <img src={item.image} alt={item.title} className="w-24 h-32 object-cover rounded-[5px]" />
                  </a>
                  <div className="flex-1 grid gap-2 text-sm">
                    <div className="grid gap-1">
                      <p className="font-semibold">{item.title}</p>
                      {item.subcategory && <p className="text-[var(--muted)]">{item.subcategory}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">₹{item.price}</span>
                      {item.mrp !== undefined && item.mrp !== null && (
                        <span className="text-xs text-[#999] line-through">₹{item.mrp}</span>
                      )}
                      {item.mrp && item.mrp > item.price && (
                        <span className="text-xs font-semibold text-green-700">
                          {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% off
                        </span>
                      )}
                    </div>
                    {item.mrp && item.mrp > item.price && (
                      <div className="text-xs text-[var(--muted)]">
                        You Save{" "}
                        <span className="text-[#1AC417]">₹{(item.mrp - item.price).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs text-[var(--muted)]">
                      {item.color && <span>Color: {colorNameFromHex(item.color)}</span>}
                      {item.size && <span>Size: {item.size}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center border border-black/20 rounded-[5px] overflow-hidden">
                        <button
                          className="px-3 cursor-pointer py-1 text-sm"
                          onClick={() => updateQty(item, Math.max(0, item.qty - 1))}
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 text-sm border-x border-black/20">{item.qty}</span>
                        <button
                          className="px-3 cursor-pointer py-1 text-sm"
                          onClick={() => updateQty(item, item.qty + 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <button className="text-xs py-2 px-5 cursor-pointer rounded-[5px] border border-black/20 hover:bg-black/10" onClick={() => removeItem(item)}>
                        Remove Product
                      </button>
                      <button
                        className="text-xs py-2 px-5 cursor-pointer rounded-[5px] border border-black/20 hover:bg-black/10"
                        onClick={() => toggleWishlist(item)}
                      >
                        {wishlistIds.has(String(item.id)) ? "Remove from Wishlist" : "Add to Wishlist"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {items.length > 0 && (
          <aside className="border-b border-t border-black/20 p-4 bg-white grid gap-3 md:sticky md:top-1/2 md:-translate-y-1/2">
            <h2 className="text-lg font-semibold">Price Summary</h2>
            <div className="flex items-center justify-between text-sm">
              <span>MRP</span>
              <span>₹{totals.mrpTotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Discount</span>
              <span className="text-green-700">
                - ₹{(totals.mrpTotal - totals.subtotal).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Shipping</span>
              <span className="text-[#1AC417]">Free</span>
            </div>
            <div className="flex items-center font-semibold justify-between text-sm">
              <span>Subtotal</span>
              <span>₹{totals.subtotal.toLocaleString("en-IN")}</span>
            </div>
            <button
              className="btn btn-primary w-full"
              onClick={() => {
                if (!requireAuth()) return;
                localStorage.removeItem("buy_now_item");
                router.push("/checkout");
              }}
            >
              Proceed to Checkout
            </button>
          </aside>
        )}
      </div>

      {recentlyViewed.length > 0 && (
        <ProductRail
          title="Recently Viewed"
          items={recentlyViewed.slice(0, 8).map((p: any) => ({
            id: p.product_id || p._id,
            title: p.name,
            price: p.discountedPrice ?? p.selling_price ?? p.price,
            mrp: p.mrp ?? p.price,
            image: p.images?.[0] || p.product_image?.[0] || "",
            images: p.images || p.product_image || [],
          }))}
        />
      )}
    </main>
  );
}
