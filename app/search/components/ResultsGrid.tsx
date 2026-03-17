"use client";

import { useRouter } from "next/navigation";
import HoverImage from "../../components/HoverImage";

type Product = {
  product_id: number;
  name?: string;
  title?: string;
  selling_price?: number;
  price?: number;
  product_image?: string[];
  status?: string;
  catagory_id?: { name?: string };
  colors?: string[];
  sizes?: string[];
  matchedColor?: string;
  colorVariants?: {
    color?: string;
    images?: string[];
    price?: number;
    discountedPrice?: number;
    sizes?: { label?: string; stock?: number }[];
  }[];
};

type Props = {
  products: Product[];
  loading: boolean;
  emptyMessage?: string;
  columns?: number;
};

const normalizeHex = (value?: string) => {
  if (!value) return "";
  const raw = value.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{3,6}$/.test(raw)) return "";
  const hex = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  return hex.toLowerCase();
};

const colorEquals = (a?: string, b?: string) => {
  if (!a || !b) return false;
  const hexA = normalizeHex(a);
  const hexB = normalizeHex(b);
  if (hexA && hexB) return hexA === hexB;
  return a.toLowerCase().trim() === b.toLowerCase().trim();
};

export default function ResultsGrid({ products, loading, emptyMessage, columns = 3 }: Props) {
  const router = useRouter();
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <span className="spinner" /> Searching…
      </div>
    );
  }
  if (!products.length) {
    return <p className="text-sm text-[var(--muted)]">{emptyMessage || "No products found."}</p>;
  }
  const gridClass =
    columns === 4
      ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      : columns === 6
        ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
        : "grid-cols-2 md:grid-cols-3";

  return (
    <div className={`grid gap-4 ${gridClass}`}>
      {products.map((p) => {
        const matchedVariant = p.matchedColor
          ? p.colorVariants?.find((v) => colorEquals(v.color, p.matchedColor))
          : undefined;
        const fallbackVariant = p.colorVariants?.[0];
        const variant = matchedVariant || fallbackVariant;
        const variantSize = variant?.sizes?.find((s) => (s?.stock ?? 0) > 0) || variant?.sizes?.[0];
        const selectedColor = p.matchedColor || variant?.color || p.colors?.[0] || "";
        const selectedSize = variantSize?.label || p.sizes?.[0] || "";
        const mrp = variant?.price ?? p.price ?? 0;
        const selling = variant?.discountedPrice ?? p.selling_price ?? variant?.price ?? p.price ?? 0;
        const discount = mrp && selling && mrp > selling ? Math.round(((mrp - selling) / mrp) * 100) : 0;
        const images = variant?.images?.length ? variant.images : p.product_image || [];

        return (
          <div
            key={p.product_id}
            className="bg-white w-full flex gap-3 md:flex-col cursor-pointer"
            onClick={() => {
              const params = new URLSearchParams();
              params.set("id", String(p.product_id));
              if (selectedColor) params.set("color", selectedColor);
              if (selectedSize) params.set("size", selectedSize);
              router.push(`/product?${params.toString()}`);
            }}
          >
            <div className="w-28 sm:w-32 md:w-full md:aspect-[3/4] bg-[rgba(0,0,0,0.04)] overflow-hidden rounded-[3px]">
              {images?.length ? (
                // eslint-disable-next-line @next/next/no-img-element
                <HoverImage images={images} alt={p.title || p.name || "product"} className="w-full h-full aspect-[3/4] rounded-[3px] bg-black/5" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-[var(--muted)]">No image</div>
              )}
            </div>
            <div className="flex-1 pt-1 md:pt-3">
              <h3 className="font-semibold text-sm line-clamp-2">{p.name || p.title || "Untitled"}</h3>
              {p.catagory_id?.name && <p className="text-xs text-[var(--muted)] mt-1">{p.catagory_id.name}</p>}
              <div className="flex items-center gap-2 text-sm mt-1">
                <span className="font-semibold">₹{selling || "-"}</span>
                <span className="text-xs text-[var(--muted)] line-through">₹{mrp || "-"}</span>
                {discount > 0 && <span className="text-xs font-semibold text-green-700">{discount}% off</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}



