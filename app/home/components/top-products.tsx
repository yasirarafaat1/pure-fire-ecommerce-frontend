"use client";

import { useEffect, useRef, useState } from "react";

type Product = {
  product_id: number;
  name?: string;
  title?: string;
  product_image?: string[];
  selling_price?: number;
  price?: number;
  status?: string;
};

const placeholders: Product[] = Array.from({ length: 5 }, (_, i) => ({
  product_id: i,
  name: "Loading...",
  product_image: [""],
}));

export default function TopProducts() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/top-products", { cache: "no-store" });
        const data = await res.json();
        if (Array.isArray(data?.products) && data.products.length) {
          setItems(data.products);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const data = items.length ? items : [];
  const hasReal = items.length > 0;

  return (
    <section className="max-w-6xl mx-auto px-4 lg:px-0 py-6 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Top Products</h2>
        <span className="text-xs text-[var(--muted)]">
          {hasReal ? "Most ordered • reviewed • wished" : "Showing available picks"}
        </span>
      </div>
      {loading && !hasReal && (
        <div className="text-sm text-[var(--muted)]">Loading top products…</div>
      )}

      {!loading && !hasReal ? (
        <div className="text-sm text-[var(--muted)]">No products found yet.</div>
      ) : (
        <div ref={trackRef} className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-2">
          {(hasReal ? data : placeholders).map((p) => (
            <div
              key={p.product_id}
              className="snap-start shrink-0 basis-2/3 sm:basis-1/3 lg:basis-1/4 xl:basis-1/5 border border-black/10 rounded-[5px] bg-white"
            >
              <div className="w-full h-40 bg-black/5 overflow-hidden rounded-t-[5px]">
                {p.product_image?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.product_image[0]} alt={p.name || p.title || "product"} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full bg-black/5 animate-pulse" />
                )}
              </div>
              <div className="p-3 space-y-1">
                <div className="text-sm font-semibold line-clamp-2">{p.name || p.title || "Product"}</div>
                <div className="text-sm">₹{p.selling_price ?? p.price ?? "-"}</div>
                {p.status && <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{p.status}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
