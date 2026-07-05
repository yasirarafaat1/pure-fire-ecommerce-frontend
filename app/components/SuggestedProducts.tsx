"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FaStar } from "react-icons/fa6";
import { cachedFetch, getCachedJson } from "../utils/cachedFetch";
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
  orderedQty?: number;
  category?: string;
  category_name?: string;
  catagory_id?: { name?: string };
  status?: string;
};

const API_BASE = "/api/user";
const SUGGESTED_ENDPOINT = `${API_BASE}/suggested-products`;
const PUBLIC_FALLBACK_ENDPOINT = `${API_BASE}/show-product?limit=12`;
const SUGGESTED_CACHE_TTL = 600000;
const placeholders = Array.from({ length: 8 }, (_, idx) => idx);

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

async function fetchSuggestedProducts(token: string) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);

  try {
    return await fetch(SUGGESTED_ENDPOINT, {
      headers: { "x-user-token": token },
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

function getProductList(data: unknown): Product[] {
  if (!data || typeof data !== "object") return [];
  const payload = data as { products?: Product[]; data?: Product[] };
  if (Array.isArray(payload.products)) return payload.products;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

async function fetchPublicFallbackProducts() {
  const cached = getCachedJson(PUBLIC_FALLBACK_ENDPOINT);
  const cachedProducts = getProductList(cached?.data).filter(
    (product) => !product.status || product.status === "published",
  );

  if (cachedProducts.length) return cachedProducts.slice(0, 8);

  const response = await cachedFetch(PUBLIC_FALLBACK_ENDPOINT, undefined, 600000, true);
  const data = await response.json();
  return getProductList(data)
    .filter((product) => !product.status || product.status === "published")
    .slice(0, 8);
}

async function fetchTopFallbackProducts() {
  const endpoint = `${API_BASE}/top-products`;
  const cached = getCachedJson(endpoint);
  const cachedProducts = getProductList(cached?.data);

  if (cachedProducts.length) {
    return [...cachedProducts]
      .sort((a, b) => Number(b.orderedQty || 0) - Number(a.orderedQty || 0))
      .slice(0, 8);
  }

  const response = await cachedFetch(endpoint, undefined, 600000, true);
  const data = await response.json();
  return getProductList(data)
    .sort((a, b) => Number(b.orderedQty || 0) - Number(a.orderedQty || 0))
    .slice(0, 8);
}

async function fetchHomepageSuggestions() {
  const publicProducts = await fetchPublicFallbackProducts();
  if (publicProducts.length) return publicProducts;
  return fetchTopFallbackProducts();
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
          const fallbackProducts = await fetchHomepageSuggestions();
          setSuggested(fallbackProducts);
          seededRef.current = fallbackProducts.length > 0;
          return;
        }

        const cachedProducts = readSuggestedCache(token);
        if (cachedProducts.length) {
          setSuggested(cachedProducts);
          setLoading(false);
          seededRef.current = true;
        }

        const res = await fetchSuggestedProducts(token);

        const data = await res.json();
        let products = getProductList(data);

        if (!res.ok || !products.length) {
          products = await fetchHomepageSuggestions();
        }

        setSuggested(products);
        if (products.length) {
          writeSuggestedCache(token, products);
          seededRef.current = true;
        } else {
          seededRef.current = false;
        }
      } catch {
        try {
          const fallbackProducts = await fetchHomepageSuggestions();
          setSuggested(fallbackProducts);
          seededRef.current = fallbackProducts.length > 0;
        } catch {
          if (!seededRef.current) setSuggested([]);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [items]);

  const display = useMemo(() => suggested.slice(0, 8), [suggested]);
  const hasReal = display.length > 0;

  return (
    <section className="suggested-products-section mx-auto mt-6 min-h-[350px] max-w-6xl p-4 py-3 md:min-h-[520px] md:p-2 md:py-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-lg border-b border-gray-600">
          Suggested for you
        </h2>
      </div>

      {loading && !hasReal ? (
        <div className="grid grid-cols-2 gap-3 rounded-[5px] sm:grid-cols-4">
          {placeholders.map((idx) => (
            <div key={idx} className="overflow-hidden rounded-[5px] bg-white">
              <div className="aspect-square w-full animate-pulse rounded-[5px] bg-black/5 md:aspect-[3/4]" />
              <div className="grid gap-2 p-3">
                <div className="h-3 w-4/5 animate-pulse rounded-[3px] bg-black/5" />
                <div className="h-3 w-1/2 animate-pulse rounded-[3px] bg-black/5" />
              </div>
            </div>
          ))}
        </div>
      ) : !hasReal ? (
        <div className="w-full rounded-[5px] border border-black/10 p-10 text-center text-sm text-[var(--muted)]">
          No suggested products yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                className="group block bg-white transition-transform duration-200 hover:-translate-y-1 active:scale-[0.98]"
              >
                <div className="suggested-product-image-frame relative w-full aspect-square md:aspect-[3/4] bg-black/5 overflow-hidden rounded-[5px] transition-shadow duration-200 group-hover:shadow-[0_14px_32px_rgba(15,23,42,0.12)]">
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
