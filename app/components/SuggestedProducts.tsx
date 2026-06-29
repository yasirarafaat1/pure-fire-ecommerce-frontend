"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
const SUGGESTED_ENDPOINT = `${API_BASE}/suggested-products`;
const SUGGESTED_CACHE_TTL = 600000;
const placeholders = Array.from({ length: 4 }, (_, idx) => idx);

function tokenCacheKey(token: string) {
  let hash = 0;
  for (let index = 0; index < token.length; index += 1) {
    hash = (hash * 31 + token.charCodeAt(index)) >>> 0;
  }
  return `suggested-products:${hash.toString(36)}`;
}

function readSuggestedCache(token: string): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(tokenCacheKey(token));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { ts?: number; products?: Product[] };
    if (!parsed?.ts || Date.now() - parsed.ts > SUGGESTED_CACHE_TTL) return [];
    return Array.isArray(parsed.products) ? parsed.products : [];
  } catch {
    return [];
  }
}

function writeSuggestedCache(token: string, products: Product[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      tokenCacheKey(token),
      JSON.stringify({ ts: Date.now(), products }),
    );
  } catch {
    // Ignore storage failures.
  }
}

export default function SuggestedProducts({ items }: { items?: Product[] }) {
  const [suggested, setSuggested] = useState<Product[]>(items || []);
  const [loading, setLoading] = useState(false);
  const seededRef = useRef(Boolean(items?.length));

  useEffect(() => {
    if (items && items.length) {
      setSuggested(items);
      setLoading(false);
      seededRef.current = true;
      return;
    }

    const load = async () => {
      if (!seededRef.current) setLoading(true);

      try {
        const token = getUserToken();

        if (!token) {
          setSuggested([]);
          seededRef.current = false;
          return;
        }

        const cachedProducts = readSuggestedCache(token);
        if (cachedProducts.length) {
          setSuggested(cachedProducts);
          setLoading(false);
          seededRef.current = true;
        }

        const res = await fetch(SUGGESTED_ENDPOINT, {
          headers: { "x-user-token": token },
          cache: "no-store",
        });

        const data = await res.json();
        const products = Array.isArray(data?.products) ? data.products : [];
        setSuggested(products);
        if (products.length) {
          writeSuggestedCache(token, products);
          seededRef.current = true;
        } else {
          seededRef.current = false;
        }
      } catch {
        if (!seededRef.current) setSuggested([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [items]);

  const display = useMemo(() => suggested.slice(0, 8), [suggested]);

  if (!loading && !display.length) return null;

  return (
    <section className="mt-6 min-h-[330px] p-4 md:min-h-[500px] md:p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-lg border-b border-gray-600">
          Suggested for you
        </h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border border-black/10 rounded-[5px] p-3">
          {placeholders.map((idx) => (
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
            const productName = p.name || p.title || "Product";
            const showRating =
              (p.avgRating || 0) > 0 && (p.reviewCount || 0) > 0;
            const sell = p.selling_price ?? p.price ?? 0;
            const mrp = p.price ?? p.selling_price ?? 0;
            const hasMrp = mrp !== undefined && mrp !== null;
            const images = Array.isArray(p.product_image)
              ? p.product_image
              : [];

            return (
              <a
                key={p.product_id}
                href={buildProductHref({
                  id: p.product_id,
                  name: productName,
                })}
                className="block bg-white"
              >
                <div className="suggested-product-image-frame relative w-full aspect-square md:aspect-[3/4] bg-black/5 overflow-hidden rounded-[5px]">
                  <HoverImage
                    images={images}
                    alt={productName}
                    className="w-full h-full"
                  />

                  {showRating && (
                    <div className="absolute bottom-2 right-2 bg-white border border-black/10 rounded-[5px] px-2 py-1 text-xs flex items-center gap-1">
                      <span>{Number(p.avgRating || 0).toFixed(1)}</span>
                      <FaStar className="text-black" />
                      <span>{p.reviewCount}</span>
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <div className="text-sm font-semibold line-clamp-2">
                    {productName}
                  </div>

                  <div className="flex items-center gap-2 text-sm mt-1">
                    <span className="font-semibold">₹{sell || "-"}</span>
                    {hasMrp && (
                      <span className="text-xs text-[#999] line-through">
                        ₹{mrp}
                      </span>
                    )}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}

      <style jsx>{`
        @media (max-width: 767px) {
          .suggested-product-image-frame :global(img) {
            object-position: top center !important;
          }
        }
      `}</style>
    </section>
  );
}
