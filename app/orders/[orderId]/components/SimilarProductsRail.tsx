"use client";

import { useEffect, useState } from "react";
import ProductRail from "../../../product/components/ProductRail";

const API_BASE = "/api/user";

type RawProduct = any;

type RailItem = {
  id?: string | number;
  productId?: string | number;
  color?: string;
  images?: string[];
  title: string;
  price: number | string;
  mrp?: number | string;
  image: string;
};

const toList = (val: any) => {
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === "string") {
    return val
      .split(/[,\s]+/)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [] as string[];
};

const getImages = (raw: any) => {
  const images: string[] = [];
  images.push(...toList(raw?.images));
  images.push(...toList(raw?.product_image));
  images.push(...toList(raw?.image));
  images.push(...toList(raw?.productImage));
  if (Array.isArray(raw?.colorVariants)) {
    raw.colorVariants.forEach((v: any) => images.push(...toList(v?.images)));
  } else {
    images.push(...toList(raw?.colorVariants?.[0]?.images));
  }
  return images.filter(Boolean);
};

const toRailItem = (p: RawProduct): RailItem | null => {
  if (!p) return null;
  const images = getImages(p);
  const image = images[0];
  if (!image) return null;
  const mrp = p.mrp ?? p.price ?? 0;
  const discount = p.discountedPrice ?? p.selling_price ?? p.discounted_price ?? mrp;
  const safeMrp = Math.max(mrp, discount);
  const safeDiscount = Math.min(mrp, discount);
  const color = p?.colorVariants?.[0]?.color || p?.colors?.[0] || "";
  return {
    id: p.product_id || p._id,
    productId: p.product_id || p._id,
    color: color || undefined,
    images,
    image,
    title: p.title || p.name || "Product",
    price: safeDiscount,
    mrp: safeMrp,
  };
};

export default function SimilarProductsRail({
  seedId,
  className,
}: {
  seedId?: string | number;
  className?: string;
}) {
  const [items, setItems] = useState<RailItem[]>([]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const load = async () => {
      if (!seedId) {
        if (active) setItems([]);
        return;
      }
      try {
        const listRes = await fetch(`${API_BASE}/show-product`, { signal: controller.signal });
        const listJson = await listRes.json();
        const list: RawProduct[] = listJson?.products || listJson?.data || [];

        const seed = list.find(
          (p: any) => String(p.product_id || p._id) === String(seedId),
        );
        const seedCategory =
          seed?.category ||
          seed?.category_name ||
          seed?.Catagory?.name ||
          seed?.Catagory?.title ||
          "";

        const baseList = (list || []).filter(
          (p: any) => String(p.product_id || p._id) !== String(seedId),
        );
        const categoryList = seedCategory
          ? baseList.filter(
              (p: any) =>
                String(
                  p?.category || p?.category_name || p?.Catagory?.name || p?.Catagory?.title || "",
                ).toLowerCase() === String(seedCategory).toLowerCase(),
            )
          : [];

        const source = categoryList.length ? categoryList : baseList;
        const mapped = source.map(toRailItem).filter(Boolean) as RailItem[];
        const unique = mapped.filter((item, idx, arr) => {
          const key = `${item.productId}-${item.color || ""}`;
          return arr.findIndex((v) => `${v.productId}-${v.color || ""}` === key) === idx;
        });
        if (active) setItems(unique.slice(0, 12));
      } catch {
        if (active) setItems([]);
      }
    };

    load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [seedId]);

  if (!items.length) return null;

  return (
    <div className={className}>
      <ProductRail title="Similar products" items={items} />
    </div>
  );
}
