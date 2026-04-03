"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import HoverImage from "../components/HoverImage";
import { getUserEmail, getUserToken } from "../utils/auth";
import { buildProductHref } from "../utils/productUrl";

const API_BASE = "/api/user";

const getEmail = () => {
  const email = getUserEmail() || "guest@purefire.local";
  localStorage.setItem("user_email", email);
  return email;
};
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

export default function WishlistPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [authReady, setAuthReady] = useState(false);

  const loadWishlist = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/wishlist/list`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-token": getToken() },
        body: JSON.stringify({ email: getEmail() }),
      });
      const data = await res.json();
      setItems(data?.products || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      const next = pathname || "/wishlist";
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    setAuthReady(true);
    loadWishlist();
    const onUpdated = () => loadWishlist();
    window.addEventListener("wishlist:updated", onUpdated as EventListener);
    return () => window.removeEventListener("wishlist:updated", onUpdated as EventListener);
  }, []);

  useEffect(() => {
    if (!authReady) return;
    const loadCart = async () => {
      const cartId = localStorage.getItem("cart_id") || "";
      if (!cartId) {
        setCartItems([]);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/get-user-cart`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-user-token": getToken() },
          body: JSON.stringify({ cart_id: cartId }),
        });
        const data = await res.json();
        setCartItems(data?.items || []);
      } catch {
        setCartItems([]);
      }
    };
    loadCart();
    const onUpdated = () => loadCart();
    window.addEventListener("cart:updated", onUpdated as EventListener);
    return () => window.removeEventListener("cart:updated", onUpdated as EventListener);
  }, [authReady]);

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
    const cartId = localStorage.getItem("cart_id") || "";
    const { color, size } = pickDefaultVariant(p);
    const payload = {
      cart_id: cartId,
      product_id: p.product_id || p._id,
      color,
      size,
      qty: 1,
      price: p.discountedPrice ?? p.selling_price ?? p.price ?? 0,
      mrp: p.mrp ?? p.price ?? 0,
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
    setCartItems(data?.items || []);
    window.dispatchEvent(new Event("cart:updated"));
  };

  if (!authReady) {
    return (
      <main className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-center py-16 text-sm text-[var(--muted)]">
          Loading...
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-6 grid gap-6">
      <header className="flex items-center justify-between">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold">Wishlist</h1>
          <p className="text-sm text-[var(--muted)]">Saved items you love.</p>
        </div>
        <a href="/" className="btn btn-ghost">
          Continue shopping
        </a>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-16 h-16 rounded-full border-2 border-black/10 border-t-black animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="border border-black/20 rounded-[6px] p-10 text-center">
          <p className="text-sm text-[var(--muted)]">Your wishlist is empty.</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((p) => {
            const id = p.product_id || p._id;
            const title = p.name || p.title || "Product";
            const price = p.discountedPrice ?? p.selling_price ?? p.price ?? 0;
            const mrp = p.mrp ?? p.price ?? 0;
            const images = p.images?.length ? p.images : p.product_image || [];
            const inCart = cartItems.some((i: any) => String(i.product_id) === String(id));
            return (
              <div key={String(id)} className="border border-black/20 rounded-[6px] overflow-hidden bg-white grid">
                <a href={buildProductHref({ id: String(id), name: title })} className="block">
                  <HoverImage
                    images={images}
                    alt={title}
                    className="w-full h-full rounded-[3px] aspect-[3/4] bg-black/5"
                  />
                </a>
                <div className="p-4 grid gap-2">
                  <div className="grid gap-1">
                    <p className="font-semibold text-sm line-clamp-2">{title}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">{"\u20B9"}{price}</span>
                    {mrp > price ? (
                      <span className="text-xs text-[#999] line-through">{"\u20B9"}{mrp}</span>
                    ) : null}
                    {mrp > price ? (
                      <span className="text-xs font-semibold text-green-700">
                        {Math.round(((mrp - price) / mrp) * 100)}% off
                      </span>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-ghost flex-1"
                      onClick={() => (inCart ? (window.location.href = "/cart") : addToCart(p))}
                    >
                      {inCart ? "Go to cart" : "Add to cart"}
                    </button>
                    <button className="btn btn-primary flex-1" onClick={() => removeWishlist(id)}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
