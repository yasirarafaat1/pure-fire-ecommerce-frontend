"use client";

import { useEffect, useState } from "react";
import { AvailableFilters, CardProduct } from "./collections-types";
import { buildContentText, buildSearchText, dedupe, getFabricValue, resolveCreatedAt, toNum } from "./collections-helpers";

const API_PRODUCTS = "/api/user/show-product?page=1&limit=100";
const API_CATEGORIES = "/api/user/get-categories";
const API_TOP = "/api/user/top-products";

export function useCollectionData() {
  const [productsData, setProductsData] = useState<CardProduct[]>([]);
  const [topProductsData, setTopProductsData] = useState<CardProduct[]>([]);
  const [availableFilters, setAvailableFilters] = useState<AvailableFilters>({
    categories: [],
    colors: [],
    discounts: [],
    ratings: [],
    availability: [],
    sizes: [],
    fabrics: [],
  });
  const [priceBounds, setPriceBounds] = useState({ min: 0, max: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const [prodRes, catRes, topRes] = await Promise.all([
          fetch(API_PRODUCTS),
          fetch(API_CATEGORIES),
          fetch(API_TOP),
        ]);

        const prodJson = prodRes.ok ? await prodRes.json() : { products: [] };
        const catJson = catRes.ok ? await catRes.json() : { categories: [] };
        const topJson = topRes.ok ? await topRes.json() : { products: [] };

        const categoryMap = new Map<string, string>();
        const categoryInfoMap = new Map<string, { name: string; ancestors: string[] }>();

        const flattenCategories = (nodes: any[], parentAncestors: string[] = []) => {
          nodes.forEach((node) => {
            if (!node?._id || !node?.name) return;
            const name = String(node.name);
            const rawAncestors = Array.isArray(node?.ancestors)
              ? node.ancestors.map((a: any) => String(a?.name || "")).filter(Boolean)
              : parentAncestors;
            const ancestors = dedupe(rawAncestors as string[]);

            categoryMap.set(String(node._id), name);
            categoryInfoMap.set(String(node._id), { name, ancestors });

            if (Array.isArray(node.children) && node.children.length) {
              flattenCategories(node.children, [...ancestors, name]);
            }
          });
        };

        const categoryList = Array.isArray(catJson.categories) ? catJson.categories : [];
        flattenCategories(categoryList);

        const shapeProduct = (p: any): CardProduct => {
          const variants = Array.isArray(p.colorVariants) ? p.colorVariants : [];
          const primaryVariant = variants.find((v: any) => v?.primary) || variants[0];
          const images =
            (primaryVariant?.images && primaryVariant.images.length ? primaryVariant.images : null) ||
            (Array.isArray(p.product_image) ? p.product_image : []);
          const colorList = dedupe([
            ...(Array.isArray(p.colors) ? p.colors : []),
            ...(variants.map((v: any) => v?.color).filter(Boolean) as string[]),
          ]);
          const sizeList = dedupe(
            [
              ...(Array.isArray(p.sizes) ? p.sizes : []),
              ...variants.flatMap((v: any) =>
                Array.isArray(v?.sizes) ? v.sizes.map((s: any) => s?.label) : [],
              ),
            ].filter(Boolean) as string[],
          );

          const selling = toNum(primaryVariant?.discountedPrice ?? p.selling_price ?? p.price ?? 0);
          const mrp = toNum(primaryVariant?.price ?? p.price ?? p.mrp ?? 0);
          const displayPrice = selling || mrp || 0;
          const displayMrp = mrp || 0;
          const inStockVariants = variants.some((v: any) =>
            Array.isArray(v?.sizes) ? v.sizes.some((s: any) => toNum(s?.stock) > 0) : false,
          );
          const inStock = inStockVariants || toNum(p.quantity) > 0;

          const rating = p?.avgRating ?? p?.rating;
          const reviews = p?.reviewCount ?? p?.reviews;
          const orderCount = toNum(p?.orderedQty ?? p?.orders ?? p?.totalOrders ?? p?.orderCount ?? 0);

          const categoryId =
            typeof p.catagory_id === "object" ? String(p.catagory_id?._id || "") : String(p.catagory_id || "");
          const meta = categoryInfoMap.get(categoryId);
          const categoryName =
            (typeof p.catagory_id === "object" ? String(p.catagory_id?.name || "") : "") ||
            categoryMap.get(categoryId) ||
            "";
          const productAncestors = Array.isArray(p.catagory_id?.ancestors)
            ? p.catagory_id.ancestors.map((a: any) => String(a?.name || "")).filter(Boolean)
            : [];
          const categoryPath = dedupe([...(meta?.ancestors || []), ...productAncestors, categoryName].filter(Boolean));
          const searchText = buildSearchText(p, categoryName, categoryPath);
          const contentText = buildContentText(p);

          return {
            id: p.product_id || p._id,
            title: p.title || p.name || "",
            price: displayPrice,
            mrp: displayMrp,
            image: images?.[0] || "",
            images: Array.isArray(images) ? images.filter(Boolean) : [],
            rating: rating ? Number(rating) : undefined,
            reviews: reviews ?? undefined,
            category: categoryName,
            categoryPath,
            colors: colorList,
            sizes: sizeList,
            fabric: getFabricValue(p) || "",
            searchText,
            contentText,
            inStock,
            createdAt: resolveCreatedAt(p),
            orderCount,
          };
        };

        const mapped: CardProduct[] = (prodJson.products || [])
          .filter((p: any) => !p?.status || p.status === "published")
          .map((p: any) => shapeProduct(p));

        const topMapped: CardProduct[] = (topJson.products || [])
          .filter((p: any) => !p?.status || p.status === "published")
          .map((p: any) => shapeProduct(p));

        const priceValues = mapped
          .map((p) => p.price || p.mrp)
          .filter((n) => Number.isFinite(n) && n > 0) as number[];
        const minPrice = priceValues.length ? Math.min(...priceValues) : 0;
        const maxPrice = priceValues.length ? Math.max(...priceValues) : 0;

        const categories = dedupe(mapped.map((p) => p.category).filter(Boolean) as string[]).sort();
        const colors = dedupe(mapped.flatMap((p) => p.colors)).filter(Boolean) as string[];
        const sizes = dedupe(mapped.flatMap((p) => p.sizes)).filter(Boolean) as string[];
        const fabrics = dedupe(mapped.map((p) => p.fabric).filter(Boolean) as string[]).sort();
        const discounts = dedupe(
          mapped
            .map((p) => {
              if (!p.mrp || p.mrp <= p.price) return 0;
              return Math.round(((p.mrp - p.price) / p.mrp) * 100);
            })
            .filter((d) => d > 0),
        ).sort((a, b) => a - b);
        const ratings = dedupe(mapped.map((p) => Math.floor(p.rating || 0)).filter((r) => r > 0)).sort((a, b) => a - b);
        const availability = dedupe([
          mapped.some((p) => p.inStock) ? "In stock" : "",
          mapped.some((p) => !p.inStock) ? "Out of stock" : "",
        ].filter(Boolean));

        if (!active) return;
        setProductsData(mapped);
        setTopProductsData(topMapped);
        setAvailableFilters({ categories, colors, discounts, ratings, availability, sizes, fabrics });
        setPriceBounds({ min: minPrice, max: maxPrice });
      } catch {
        if (!active) return;
        setProductsData([]);
        setTopProductsData([]);
        setAvailableFilters({
          categories: [],
          colors: [],
          discounts: [],
          ratings: [],
          availability: [],
          sizes: [],
          fabrics: [],
        });
        setPriceBounds({ min: 0, max: 0 });
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  return {
    productsData,
    topProductsData,
    availableFilters,
    priceBounds,
    isLoading,
  };
}
