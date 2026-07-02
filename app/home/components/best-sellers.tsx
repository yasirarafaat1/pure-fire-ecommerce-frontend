"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cachedFetch, getCachedJson } from "../../utils/cachedFetch";
import HoverImage from "../../components/HoverImage";
import { BiRightArrowAlt } from "react-icons/bi";
import { buildProductHref } from "../../utils/productUrl";

type Product = {
  product_id: number;
  name?: string;
  title?: string;
  product_image?: string[];
  selling_price?: number;
  price?: number;
  orderedQty?: number;
};

const placeholders: Product[] = Array.from({ length: 8 }, (_, i) => ({
  product_id: i,
  name: "Loading...",
  product_image: [""],
}));

export default function BestSellers() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const seededRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      if (!seededRef.current) setLoading(true);

      try {
        const cached = getCachedJson("/api/user/top-products");
        const cachedList = Array.isArray(cached?.data?.products)
          ? cached?.data?.products
          : [];

        const cachedSorted = [...(cachedList as Product[])].sort(
          (a, b) => (b.orderedQty || 0) - (a.orderedQty || 0),
        );

        if (cachedSorted.length) {
          setItems(cachedSorted.slice(0, 8));
          setLoading(false);
          seededRef.current = true;
        }

        const res = await cachedFetch(
          "/api/user/top-products",
          undefined,
          600000,
          true,
        );

        const data = await res.json();
        const list = Array.isArray(data?.products) ? data.products : [];

        const sorted = [...(list as Product[])].sort(
          (a, b) => (b.orderedQty || 0) - (a.orderedQty || 0),
        );

        setItems(sorted.slice(0, 8));
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
    <section className="best-sellers-section mx-auto min-h-[350px] max-w-6xl p-4 py-3 md:min-h-[520px] md:p-2 md:py-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="border-b border-gray-600 text-lg font-semibold">
          Best Sellers
        </h2>
      </div>

      {loading && !hasReal ? (
        <div className="grid grid-cols-2 gap-3 rounded-[5px] sm:grid-cols-4">
          {placeholders.map((p) => (
            <div
              key={p.product_id}
              className="overflow-hidden rounded-[5px] bg-white"
            >
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
          No best sellers yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map((p) => {
            const name = p.name || p.title || "Product";
            const selling = p.selling_price ?? p.price ?? 0;
            const mrp = p.price ?? p.selling_price ?? 0;
            const images = Array.isArray(p.product_image)
              ? p.product_image
              : [];

            return (
              <a
                key={p.product_id}
                href={buildProductHref({ id: p.product_id, name })}
                className="block bg-white"
              >
                <div className="best-seller-image-frame relative aspect-square w-full overflow-hidden rounded-[5px] bg-black/5 md:aspect-[3/4]">
                  <HoverImage
                    images={images}
                    alt={name}
                    className="h-full w-full"
                  />

                  <span className="absolute right-2 top-2 rounded-[3px] bg-black px-2 py-1 text-[10px] text-white">
                    Bestseller
                  </span>
                </div>

                <div className="p-3">
                  <div className="line-clamp-2 text-sm font-semibold">
                    {name}
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <span className="font-semibold">₹{selling || "-"}</span>

                    {mrp ? (
                      <span className="text-xs text-[#999] line-through">
                        ₹{mrp}
                      </span>
                    ) : null}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}

      <Link
        href="/collections/best-seller"
        className="view-all-soft-cta group relative mx-auto mt-4 flex w-full max-w-md items-center justify-center gap-2 overflow-hidden rounded-[6px] border border-black/60 bg-white px-4 py-2.5 text-black transition-all duration-300 hover:-translate-y-0.5 hover:border-black hover:text-white hover:shadow-[0_10px_24px_rgba(0,0,0,0.12)] active:scale-[0.98]"
      >
        <span className="relative z-10 text-sm font-semibold transition-colors duration-300 group-hover:!text-white">
          View All
        </span>

        <BiRightArrowAlt className="relative z-10 text-xl transition-transform duration-300 group-hover:translate-x-1 group-hover:!text-white" />
      </Link>

      <style jsx global>{`
        .best-sellers-section .view-all-soft-cta {
          isolation: isolate;
          background: #ffffff !important;
          background-color: #ffffff !important;
          color: #000000;
          transform: translateZ(0);
        }

        .best-sellers-section .view-all-soft-cta::before {
          content: "";
          position: absolute;
          left: -18px;
          bottom: -18px;
          z-index: 0;
          width: 38px;
          height: 38px;
          border-radius: 999px;
          background: #000000 !important;
          background-color: #000000 !important;
          opacity: 1 !important;
          pointer-events: none;
          transform: scale(0);
          transform-origin: bottom left;
          transition: transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform;
        }

        .best-sellers-section .view-all-soft-cta:hover::before {
          transform: scale(13);
          background: #000000 !important;
          background-color: #000000 !important;
        }

        .best-sellers-section .view-all-soft-cta:hover {
          color: #ffffff !important;
        }

        .best-sellers-section .view-all-soft-cta span,
        .best-sellers-section .view-all-soft-cta svg {
          position: relative;
          z-index: 10;
        }

        .best-sellers-section .view-all-soft-cta:hover span,
        .best-sellers-section .view-all-soft-cta:hover svg {
          color: #ffffff !important;
        }

        @media (max-width: 767px) {
          .best-sellers-section .best-seller-image-frame img {
            object-position: top center !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .best-sellers-section .view-all-soft-cta,
          .best-sellers-section .view-all-soft-cta::before,
          .best-sellers-section .view-all-soft-cta svg {
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
}