"use client";

import { useEffect, useMemo, useState } from "react";
import ProductRail from "../product/components/ProductRail";

const API_BASE = "/api/user";

type CartItem = {
  id: string | number;
  title: string;
  price: number;
  mrp?: number;
  qty: number;
  image: string;
  images?: string[];
};

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("cart");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      } catch {
        // ignore bad local data
      }
    }
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/show-product`)
      .then((r) => r.json())
      .then((d) => setRecentlyViewed(d?.products || d?.data || []))
      .catch(() => setRecentlyViewed([]));
  }, []);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const mrpTotal = items.reduce((sum, i) => sum + (i.mrp ?? i.price) * i.qty, 0);
    return { subtotal, mrpTotal };
  }, [items]);

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-6 grid gap-6">
      <header className="grid gap-1">
        <h1 className="text-2xl font-semibold">Shopping Cart</h1>
        <p className="text-sm text-[var(--muted)]">Review your items before checkout.</p>
      </header>

      <div className={`grid gap-6 items-start ${items.length ? "md:grid-cols-[1.5fr_0.5fr]" : ""}`}>
        <section className="border border-black/20 rounded-[6px] p-4 bg-white">
          {items.length === 0 ? (
            <div className="grid gap-10 text-sm text-[var(--muted)] place-items-center text-center py-10">
              <p>Your cart is empty.</p>
              <a href="/" className="btn btn-primary">
                Continue shopping
              </a>
            </div>
          ) : (
            <div className="grid gap-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 border-b border-black/10 pb-4">
                  <img src={item.image} alt={item.title} className="w-24 h-32 object-cover rounded-[5px]" />
                  <div className="flex-1 grid gap-2">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold">₹ {item.price}</span>
                      {item.mrp && <span className="text-xs text-[#999] line-through">₹ {item.mrp}</span>}
                    </div>
                    <div className="text-xs text-[var(--muted)]">Qty: {item.qty}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {items.length > 0 && (
          <aside className="border border-black/20 rounded-[6px] p-4 bg-white grid gap-3">
            <h2 className="text-lg font-semibold">Price Summary</h2>
            <div className="flex items-center justify-between text-sm">
              <span>Subtotal</span>
              <span>₹ {totals.subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>MRP</span>
              <span>₹ {totals.mrpTotal.toLocaleString("en-IN")}</span>
            </div>
            <button className="btn btn-primary w-full">Proceed to Checkout</button>
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
