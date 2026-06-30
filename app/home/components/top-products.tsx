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

function getProductImage(product: Product) {
  const raw = Array.isArray(product.product_image)
    ? product.product_image[0] || ""
    : "";

  if (!raw) return "";

  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("/") ||
    raw.startsWith("data:") ||
    raw.startsWith("blob:")
  ) {
    return raw;
  }

  return `/${raw}`;
}

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
          ? cachedProducts.data.products
          : [];

        const initialCategoryMap =
          (cachedCategories?.data?.categories || []).reduce(
            (acc: Record<string, string>, c: any) => {
              const id = String(c?._id || c?.id || "");
              if (id) acc[id] = c?.name || "";
              return acc;
            },
            {},
          ) || {};

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

  const hasReal = items.length > 0;

  const getCategoryLabel = (product: Product) => {
    const direct = product.category || product.category_name || "";

    if (direct) return direct;

    const catObj = product.catagory_id as any;

    if (catObj && typeof catObj === "object" && catObj.name) {
      return catObj.name;
    }

    const id =
      typeof product.catagory_id === "string"
        ? product.catagory_id
        : catObj?._id || "";

    return categoryMap[String(id)] || "Category";
  };

  return (
    <section className="mx-4 my-4 overflow-hidden rounded-[14px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_32%),linear-gradient(135deg,#141414,#24201b_55%,#0b0b0b)] px-3 py-4 text-white shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:mx-auto md:max-w-6xl md:px-5 md:py-5">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-800 text-white">
            Top Products
          </h2>
        </div>
      </div>

      {loading && !hasReal ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {placeholders.map((product) => (
            <div
              key={product.product_id}
              className="overflow-hidden rounded-[12px] border border-white/10 bg-white/95 p-2"
            >
              <div className="aspect-square w-full animate-pulse rounded-[10px] bg-black/5" />

              <div className="grid gap-2 p-2">
                <div className="h-3 w-20 animate-pulse rounded-full bg-black/10" />
                <div className="h-3 w-full animate-pulse rounded-full bg-black/10" />
                <div className="h-3 w-2/3 animate-pulse rounded-full bg-black/10" />
              </div>
            </div>
          ))}
        </div>
      ) : !hasReal ? (
        <div className="rounded-[12px] border border-white/12 bg-white/8 px-4 py-10 text-center text-sm font-semibold text-white/70">
          No top products yet. Check back soon.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((product) => {
            const name = product.name || product.title || "Product";
            const category = getCategoryLabel(product);
            const image = getProductImage(product);

            return (
              <a
                key={product.product_id}
                href={buildProductHref({ id: product.product_id, name })}
                className="group block"
              >
                <div className="relative overflow-hidden">
                  <div className="top-product-image-frame relative aspect-square w-full overflow-hidden rounded-[5px]">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt={name}
                        className="block h-full w-full object-cover object-top"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full animate-pulse rounded-[10px] bg-white/10" />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-1 px-3 py-3">
                  <p
                    className="truncate text-[11px] font-black uppercase tracking-[0.15em] text-white"
                    title={category}
                  >
                    {category}
                  </p>
                  <span className="leading-none text-white transition-transform duration-300 group-hover:translate-x-0.5">
                    →
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .top-product-image-frame {
          background: none !important;
        }

        .top-product-image-frame :global(img) {
          aspect-ratio: 1 / 1;
          object-position: top center !important;
          background: none !important;
        }
      `}</style>
    </section>
  );
}