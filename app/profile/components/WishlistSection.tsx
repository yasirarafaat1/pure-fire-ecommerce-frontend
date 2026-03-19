"use client";

import { useEffect, useState } from "react";
import { getUserToken } from "../../utils/auth";

const API_BASE = "/api/user";
const getToken = () => getUserToken();

type Product = {
  product_id?: number;
  _id?: string;
  name?: string;
  title?: string;
  price?: number;
  mrp?: number;
  selling_price?: number;
  discountedPrice?: number;
  product_image?: string[];
  images?: string[];
  colors?: string[];
  sizes?: string[];
  colorVariants?: {
    color?: string;
    sizes?: { label?: string; size?: string }[] | string[];
    images?: string[];
  }[];
};

const getEmail = () => {
  const email = (localStorage.getItem("user_email") || "guest@purefire.local").trim();
  localStorage.setItem("user_email", email);
  return email;
};

export default function WishlistSection({ email }: { email: string }) {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartId, setCartId] = useState("");

  const loadWishlist = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/wishlist/list`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-token": getToken() },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setItems(data?.products || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const pickDefaultVariant = (p: Product) => {
    const firstVariant = p.colorVariants?.[0];
    const color = firstVariant?.color || p.colors?.[0] || "";
    const sizes = Array.isArray(firstVariant?.sizes) ? firstVariant?.sizes : p.sizes || [];
    const size =
      (sizes as any[])
        .map((s) => (typeof s === "string" ? s : s?.label || s?.size || String(s)))
        .filter((s) => s && s !== "[object Object]")[0] || "";
    return { color, size };
  };

  const addToCart = async (p: Product) => {
    const storedCartId = localStorage.getItem("cart_id") || "";
    const { color, size } = pickDefaultVariant(p);
    const payload = {
      cart_id: storedCartId,
      product_id: p.product_id || p._id,
      color,
      size,
      qty: 1,
      price: p.discountedPrice ?? p.selling_price ?? p.price ?? 0,
      title: p.name || p.title || "Product",
      image: p.images?.[0] || p.product_image?.[0] || "",
    };
    const res = await fetch(`${API_BASE}/add-to-cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-token": getToken() },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data?.cart_id) localStorage.setItem("cart_id", data.cart_id);
    if (data?.cart_id) setCartId(data.cart_id);
    setCartItems(data?.items || []);
    window.dispatchEvent(new Event("cart:updated"));
  };

  const loadCart = async (id: string) => {
    if (!id) {
      setCartItems([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/get-user-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-token": getToken() },
        body: JSON.stringify({ cart_id: id }),
      });
      const data = await res.json();
      setCartItems(data?.items || []);
    } catch {
      setCartItems([]);
    }
  };

  const removeWishlist = async (productId?: number | string) => {
    if (!productId) return;
    await fetch(`${API_BASE}/wishlist/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-token": getToken() },
      body: JSON.stringify({ email: getEmail(), product_id: productId }),
    });
    loadWishlist();
    window.dispatchEvent(new Event("wishlist:updated"));
  };

  useEffect(() => {
    const stored = localStorage.getItem("cart_id") || "";
    setCartId(stored);
  }, []);

  useEffect(() => {
    if (!email) return;
    loadWishlist();
    const onUpdated = () => loadWishlist();
    window.addEventListener("wishlist:updated", onUpdated as EventListener);
    return () => window.removeEventListener("wishlist:updated", onUpdated as EventListener);
  }, [email]);

  useEffect(() => {
    loadCart(cartId);
    const onUpdated = () => loadCart(localStorage.getItem("cart_id") || "");
    window.addEventListener("cart:updated", onUpdated as EventListener);
    return () => window.removeEventListener("cart:updated", onUpdated as EventListener);
  }, [cartId]);

  if (loading) {
    return (
      <div className="grid gap-3">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="border border-black/15 rounded-[3px] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 border border-black/10 rounded-[3px] bg-black/5 animate-pulse" />
              <div className="grid gap-2">
                <div className="h-3 w-32 bg-black/5 border border-black/10 rounded-[3px] animate-pulse" />
                <div className="h-3 w-20 bg-black/5 border border-black/10 rounded-[3px] animate-pulse" />
              </div>
            </div>
            <div className="h-8 w-16 bg-black/5 border border-black/10 rounded-[3px] animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="border border-black/10 rounded-[3px] p-6 text-sm text-[var(--muted)]">
        Your wishlist is empty.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((p) => {
        const id = p.product_id || p._id;
        const title = p.name || p.title || "Product";
        const price = p.discountedPrice ?? p.selling_price ?? p.price ?? 0;
        const mrp = p.mrp ?? 0;
        const image = p.images?.[0] || p.product_image?.[0] || "";
        const { color, size } = pickDefaultVariant(p);
        const params = new URLSearchParams();
        params.set("id", String(id));
        if (color) params.set("color", color);
        if (size) params.set("size", size);
        const href = `/product?${params.toString()}`;
        const inCart = cartItems.some((i: any) => String(i.product_id) === String(id));
        return (
          <div key={String(id)} className="flex items-center justify-between gap-5">
            <div className="flex items-center gap-3">
              <a href={href} className="block">
                <div className="w-25 h-25 border border-black/10 rounded-[3px] bg-black/5 overflow-hidden">
                  {image ? (
                    <img src={image} alt={title} className="w-full h-full object-cover aspect-[3/4]" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-[var(--muted)]">
                      IMG
                    </div>
                  )}
                </div>
              </a>
              <div>
                <div className="text-sm font-semibold">{title}</div>
                <span className="font-semibold text-[var(--muted)]">₹{price}</span>
                {mrp > price ? <span className="text-xs text-[#999] line-through">₹{mrp}</span> : null}
                {mrp > price ? (
                  <span className="text-xs font-semibold text-green-700">
                    {Math.round(((mrp - price) / mrp) * 100)}% off
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
              <button
                className="btn btn-ghost flex-1 md:flex-none"
                onClick={() => (inCart ? (window.location.href = "/cart") : addToCart(p))}
              >
                {inCart ? "Go to cart" : "Add to cart"}
              </button>
              <button className="btn btn-primary text-sm flex-1 md:flex-none" onClick={() => removeWishlist(id)}>
                Remove
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
