"use client";

import { FaStar } from "react-icons/fa";
import HoverImage from "../../../components/HoverImage";
import { CardProduct } from "./collections-types";

type Props = {
  isLoading: boolean;
  products: CardProduct[];
  discount: (price: number, mrp: number) => number;
  onSelect: (product: CardProduct) => void;
};

export default function ProductsGrid({ isLoading, products, discount, onSelect }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="overflow-hidden bg-white">
            <div className="w-full aspect-square rounded-[3px] border border-black/10 bg-black/5 animate-pulse" />
            <div className="py-3 grid gap-2">
              <div className="h-4 w-3/4 bg-black/5 border border-black/10 rounded-[3px] animate-pulse" />
              <div className="h-3 w-1/2 bg-black/5 border border-black/10 rounded-[3px] animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="border border-black/10 rounded-[5px] p-10 text-center text-sm text-[var(--muted)]">
        No items found. Try clearing some filters.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {products.map((p) => (
        <div
          key={p.id}
          className="overflow-hidden cursor-pointer bg-white"
          onClick={() => onSelect(p)}
        >
          <div className="relative">
            <HoverImage images={p.images} alt={p.title} className="w-full h-full aspect-[3/4] rounded-[3px] bg-black/5" />
            {p.rating ? (
              <div className="absolute bottom-2 right-2 bg-white text-black px-2 py-1 rounded-[5px] text-xs font-semibold flex items-center gap-1 border border-black/10">
                <span>{p.rating.toFixed(1)}</span>
                <FaStar className="text-[#000]" />
                {p.reviews && <span className="text-[10px] text-[var(--muted)]">{p.reviews}</span>}
              </div>
            ) : null}
          </div>
          <div className="py-3 grid gap-1">
            <p className="text-sm font-medium line-clamp-2">{p.title}</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">?{p.price}</span>
              <span className="text-xs text-red-400 line-through">?{p.mrp}</span>
              {discount(p.price, p.mrp) > 0 && (
                <span className="text-xs font-semibold text-green-700">{discount(p.price, p.mrp)}% off</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
