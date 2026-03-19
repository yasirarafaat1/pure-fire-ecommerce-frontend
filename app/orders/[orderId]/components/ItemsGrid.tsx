"use client";

import namer from "color-namer";

type Item = {
  product_id?: number;
  quantity?: number;
  price?: number;
  color?: string;
  size?: string;
  image?: string;
  images?: string[];
  product?: {
    title?: string;
    name?: string;
    product_image?: string | string[];
    colorVariants?: Array<{ color?: string; images?: string[] }>;
  };
};

type Props = {
  items: Item[];
  formatMoney: (value: number) => string;
};

const colorNameFromHex = (input: string) => {
  const raw = (input || "").trim();
  if (!raw) return "";
  const hex = raw.startsWith("#")
    ? raw
    : /^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(raw)
      ? `#${raw}`
      : "";
  if (hex) {
    try {
      const result = namer(hex);
      return result?.basic?.[0]?.name || result?.html?.[0]?.name || "Custom";
    } catch {
      return "Custom";
    }
  }
  return raw.replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function ItemsGrid({ items, formatMoney }: Props) {
  const totalQty = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0) || 0;
  return (
    <div className="border-b border-t border-black/15 p-5 grid gap-4">
      <div className="text-sm font-semibold">Items ({totalQty})</div>
      <div className="grid gap-3 grid-cols-2">
        {items.map((it, idx) => {
          const title = it.product?.title || it.product?.name || "Product";
          const localImages = it.images && it.images.length ? it.images : [];
          const inlineImage = it.image || localImages[0] || "";
          const rawImages = it.product?.product_image as any;
          const productImage = Array.isArray(rawImages) ? rawImages[0] : rawImages || "";
          const variantList = it.product?.colorVariants || [];
          const variantImage =
            variantList
              .find((v) => (v.color || "").toLowerCase() === (it.color || "").toLowerCase())
              ?.images?.[0] || "";
          const fallbackVariantImage = variantList[0]?.images?.[0] || "";
          const image = inlineImage || variantImage || fallbackVariantImage || productImage || "";
          const isLast = idx === items.length - 1;
          const spanAll = items.length % 2 === 1 && isLast;
          const productLink = `/product?id=${it.product_id}${
            it.color ? `&color=${encodeURIComponent(it.color)}` : ""
          }${it.size ? `&size=${encodeURIComponent(it.size)}` : ""}`;
          return (
            <div
              key={`${it.product_id || idx}-${idx}`}
              className={`border-b border-t border-black/10 py-3 grid gap-2 grid-cols-[72px_1fr] items-center ${
                spanAll ? "col-span-2 md:col-span-2 gap-5" : ""
              }`}
            >
              <a href={productLink} className="block">
                <div className="w-full h-20 bg-black/5 rounded-[5px] overflow-hidden">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-[var(--muted)]">
                      No image
                    </div>
                  )}
                </div>
              </a>
              <div className="grid gap-1">
                <div className="text-sm font-semibold">{title}</div>
                <div className="text-xs text-[var(--muted)]">Qty: {it.quantity || 1}</div>
                {(it.color || it.size) && (
                  <div className="text-xs text-[var(--muted)]">
                    {it.color ? `Color: ${colorNameFromHex(it.color)}` : ""}
                    {it.color && it.size ? " | " : ""}
                    {it.size ? `Size: ${it.size}` : ""}
                  </div>
                )}
                <div className="text-sm">{formatMoney(Number(it.price) || 0)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

