"use client";

import { useEffect, useMemo, useState } from "react";
import { FaStar } from "react-icons/fa6";
import { getUserToken } from "../utils/auth";
import HoverImage from "./HoverImage";
import { buildProductHref } from "../utils/productUrl";

type Product = {
  product_id: number;
  name?: string;
  title?: string;
  product_image?: string[];
  selling_price?: number;
  price?: number;
  avgRating?: number;
  reviewCount?: number;
  category?: string;
  category_name?: string;
  catagory_id?: { name?: string };
};

const API_BASE = "/api/user";

export default function SuggestedProducts({ items }: { items?: Product[] }) {
  const [suggested, setSuggested] = useState<Product[]>(items || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (items && items.length) {
      setSuggested(items);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const token = getUserToken();
        if (!token) {
          setSuggested([]);
          return;
        }
        const res = await fetch(`${API_BASE}/suggested-products`, {
          headers: { "x-user-token": token },
          cache: "no-store",
        });
        const data = await res.json();
        setSuggested(data?.products || []);
      } catch {
        setSuggested([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [items]);

  const display = useMemo(() => suggested.slice(0, 8), [suggested]);
  if (!loading && !display.length) return null;

  return (
    <section className="mt-6 p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-lg border-b border-gray-600">Suggested for you</h2>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border border-black/10 rounded-[5px] p-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-[5px]">
              <div className="w-full aspect-square md:aspect-[3/4] bg-black/5 animate-pulse rounded-t-[5px]" />
              <div className="p-3">
                <div className="h-3 w-24 bg-black/5 rounded-[3px] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {display.map((p) => {
            const showRating = (p.avgRating || 0) > 0 && (p.reviewCount || 0) > 0;
            const sell = p.selling_price ?? p.price ?? 0;
            const mrp = p.price ?? p.selling_price ?? 0;
            const hasMrp = mrp !== undefined && mrp !== null;
            const images = Array.isArray(p.product_image) ? p.product_image : [];
            return (
              <a
                key={p.product_id}
                href={buildProductHref({ id: p.product_id, name: p.name || p.title || "product" })}
                className="block bg-white"
              >
                <div className="relative w-full aspect-square md:aspect-[3/4] bg-black/5 overflow-hidden rounded-[5px]">
                  <HoverImage images={images} alt={p.name || p.title || "product"} className="w-full h-full" />
                  {showRating && (
                    <div className="absolute bottom-2 right-2 bg-white border border-black/10 rounded-[5px] px-2 py-1 text-xs flex items-center gap-1">
                      <span>{Number(p.avgRating || 0).toFixed(1)}</span>
                      <FaStar className="text-black" />
                      <span>{p.reviewCount}</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="text-sm font-semibold line-clamp-2">{p.name || p.title || "Product"}</div>
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <span className="font-semibold">₹{sell || "-"}</span>
                    {hasMrp && <span className="text-xs text-[#999] line-through">₹{mrp}</span>}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}
