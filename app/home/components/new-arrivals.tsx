"use client";

import { useEffect, useState } from "react";
import HoverImage from "../../components/HoverImage";
import { BiRightArrowAlt } from "react-icons/bi";

type Product = {
  product_id: number;
  name?: string;
  title?: string;
  product_image?: string[];
  selling_price?: number;
  price?: number;
  status?: string;
};

const placeholders: Product[] = Array.from({ length: 4 }, (_, i) => ({
  product_id: i,
  name: "Loading...",
  product_image: [""],
}));

export default function NewArrivals() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/user/show-product?limit=12", { cache: "no-store" });
        const data = await res.json();
        const list = Array.isArray(data?.products) ? data.products : [];
        const published = list.filter((p: any) => !p?.status || p.status === "published");
        setItems(published.slice(0, 8));
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const hasReal = items.length > 0;

  return (
    <section className="max-w-6xl mx-auto p-4 md:p-2 py-3 md:py-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold border-b border-gray-600">New Arrivals</h2>
      </div>
      {loading && !hasReal ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border border-black/10 rounded-[5px] p-3">
          {placeholders.map((p) => (
            <div key={p.product_id} className="bg-white rounded-[5px]">
              <div className="w-full aspect-square md:aspect-[3/4] bg-black/5 rounded-t-[5px] animate-pulse" />
              <div className="p-3">
                <div className="h-3 w-24 bg-black/5 rounded-[3px] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : !hasReal ? (
        <div className="border border-black/10 rounded-[5px] p-10 text-center text-sm text-[var(--muted)] w-full">
          No new arrivals yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {items.map((p) => {
            const name = p.name || p.title || "Product";
            const selling = p.selling_price ?? p.price ?? 0;
            const mrp = p.price ?? p.selling_price ?? 0;
            const images = Array.isArray(p.product_image) ? p.product_image : [];
            return (
              <a key={p.product_id} href={`/product?id=${p.product_id}`} className="block bg-white">
                <div className="relative w-full aspect-square md:aspect-[3/4] bg-black/5 overflow-hidden rounded-[5px]">
                  <HoverImage images={images} alt={name} className="w-full h-full" />
                  <span className="absolute top-2 right-2 bg-black text-white text-[10px] px-2 py-1 rounded-[3px]">
                    New
                  </span>
                </div>
                <div className="p-3">
                  <div className="text-sm font-semibold line-clamp-2">{name}</div>
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <span className="font-semibold">₹{selling || "-"}</span>
                    {mrp ? <span className="text-xs text-[#999] line-through">₹{mrp}</span> : null}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
      <div className="group flex items-center justify-center border border-gray-600 rounded-[5px] p-2 mt-3 cursor-pointer max-w-sm mx-auto text-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-black hover:text-white hover:border-black">
        <a href="/collections/new-arrival" className="text-sm font-semibold">View All</a>
        <BiRightArrowAlt className="text-current" />
      </div>
    </section>
  );
}








