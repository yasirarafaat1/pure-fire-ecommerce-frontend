"use client";

import { useEffect, useRef, useState } from "react";
import { cachedFetch, getCachedJson } from "../../utils/cachedFetch";
import { buildProductHref } from "../../utils/productUrl";

type Product = {
  product_id: number;
  name?: string;
  title?: string;
  product_image?: string[];
  catagory_id?: string | { _id?: string; name?: string };
  category?: string;
  category_name?: string;
};

const placeholders: Product[] = Array.from({ length: 5 }, (_, i) => ({
  product_id: i,
  name: "Loading...",
  product_image: [""],
}));

export default function TopProducts() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const seededRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      if (!seededRef.current) setLoading(true);
      try {
        const cachedProducts = getCachedJson("/api/admin/top-products");
        const cachedCategories = getCachedJson("/api/user/get-categories");
        const initialItems = Array.isArray(cachedProducts?.data?.products)
          ? cachedProducts?.data?.products
          : [];
        const initialCategoryMap =
          (cachedCategories?.data?.categories || []).reduce((acc: Record<string, string>, c: any) => {
            const id = String(c?._id || c?.id || "");
            if (id) acc[id] = c?.name || "";
            return acc;
          }, {}) || {};
        if (initialItems.length) {
          setItems(initialItems);
          setLoading(false);
          seededRef.current = true;
        }
        if (Object.keys(initialCategoryMap).length) {
          setCategoryMap(initialCategoryMap);
        }

        const [prodRes, catRes] = await Promise.all([
          cachedFetch("/api/admin/top-products", undefined, 600000, true),
          cachedFetch("/api/user/get-categories", undefined, 600000, true),
        ]);
        const data = await prodRes.json();
        const catData = catRes.ok ? await catRes.json() : { categories: [] };
        const map: Record<string, string> = {};
        (catData?.categories || []).forEach((c: any) => {
          const id = String(c?._id || c?.id || "");
          if (id) map[id] = c?.name || "";
        });
        if (Object.keys(map).length) setCategoryMap(map);
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
  const getCategoryLabel = (p: Product) => {
    const direct = p.category || p.category_name || "";
    if (direct) return direct;
    const catObj = p.catagory_id as any;
    if (catObj && typeof catObj === "object" && catObj.name) return catObj.name;
    const id = typeof p.catagory_id === "string" ? p.catagory_id : catObj?._id || "";
    return categoryMap[String(id)] || "Category";
  };

  return (
    <section className="max-w-6xl mx-4 md:mx-auto p-4 md:px-4 py-3 md:py-5 border border-black/10 rounded-[5px] bg-black/50 text-white">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Top Products</h2>
      </div>
      {loading && !hasReal ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 border border-black/10 rounded-[5px] p-3">
          {placeholders.map((p) => (
            <div key={p.product_id} className="rounded-[5px]">
              <div className="w-full aspect-square bg-black/5 rounded-t-[5px] animate-pulse" />
              <div className="p-3">
                <div className="h-3 w-24 bg-black/5 rounded-[3px] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : !hasReal ? (
        <div className="border border-black/10 rounded-[5px] p-10 text-center text-sm text-[var(--muted)] w-full">
          No top products yet. Check back soon.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {(hasReal ? data : placeholders).map((p) => {
            const card = (
              <div className="rounded-[5px] pt-4">
                <div className="w-full aspect-square bg-black/5 overflow-hidden rounded-[5px]">
                  {p.product_image?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.product_image[0]} alt={p.name || p.title || "product"} className="w-full h-full object-cover object-center" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-black/5 animate-pulse" />
                  )}
                </div>
                <div className="p-3">
                  <div className="text-sm font-semibold line-clamp-2">{hasReal ? getCategoryLabel(p) : "Loading..."}</div>
                </div>
              </div>
            );
            return hasReal ? (
              <a
                key={p.product_id}
                href={buildProductHref({ id: p.product_id, name: p.name || p.title || "product" })}
                className="block"
              >
                {card}
              </a>
            ) : (
              <div key={p.product_id}>{card}</div>
            );
          })}
        </div>
      )}
    </section>
  );
}
