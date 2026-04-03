"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCollectionData } from "./useCollectionData";
import { buildVariants, dedupe, isCotton, isHalfSleeve, isJeansProduct, isKurtaProduct, isShirt, isSummerProduct, isTshirt, normalizeName } from "./collections-helpers";
import { CardProduct, FiltersState } from "./collections-types";
import { buildProductHref } from "../../../utils/productUrl";
const sortOptions = ["Popularity", "Price -- Low to High", "Price -- High to Low", "Newest First"];
const emptyFilters: FiltersState = {
  categories: [],
  colors: [],
  discounts: [],
  ratings: [],
  availability: [],
  sizes: [],
  fabrics: [],
  price: { min: 0, max: 0 },
};
export function useCollectionPage() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const { productsData, topProductsData, availableFilters, priceBounds, isLoading } = useCollectionData();
  const [query, setQuery] = useState({ category: "", sub: "", child: "", collection: "" });
  const [activeSort, setActiveSort] = useState(sortOptions[0]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    category: false, price: false, color: false, size: false, fabric: false, discount: false, rating: false, availability: false,
  });
  const [pendingFilters, setPendingFilters] = useState<FiltersState>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<FiltersState>(emptyFilters);
  const priceInitRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setQuery({
      category: (params.get("category") || "").trim(),
      sub: (params.get("sub") || "").trim(),
      child: (params.get("child") || "").trim(),
      collection: (params.get("collection") || "").trim(),
    });
  }, [pathname]);
  useEffect(() => {
    if (priceInitRef.current) return;
    if (priceBounds.max <= priceBounds.min) return;
    priceInitRef.current = true;
    setPendingFilters((prev) => ({ ...prev, price: { min: priceBounds.min, max: priceBounds.max } }));
    setAppliedFilters((prev) => ({ ...prev, price: { min: priceBounds.min, max: priceBounds.max } }));
  }, [priceBounds]);
  const discount = useMemo(
    () => (price: number, mrp: number) => {
      if (!mrp || mrp <= price) return 0;
      return Math.round(((mrp - price) / mrp) * 100);
    },
    [],
  );
  const slugKey = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("collections");
    return idx >= 0 ? parts[idx + 1] || "all" : "all";
  }, [pathname]);
  const slugParts = useMemo(() => slugKey.toLowerCase().split("-").filter(Boolean), [slugKey]);
  useEffect(() => {
    if (slugKey === "new-arrival") {
      setActiveSort("Newest First");
    } else if (slugKey === "best-seller" || slugKey === "high-rated") {
      setActiveSort("Popularity");
    }
  }, [slugKey]);
  const toggleSection = (key: string) => setOpenSections((s) => ({ ...s, [key]: !s[key] }));
  const toggleValue = <T,>(key: keyof FiltersState, value: T) => {
    setPendingFilters((prev) => {
      const list = prev[key] as T[];
      const exists = list.includes(value as any);
      const next = exists ? list.filter((v) => v !== (value as any)) : [...list, value as any];
      return { ...prev, [key]: next } as FiltersState;
    });
  };
  const setPriceMin = (val: number) => setPendingFilters((prev) => ({ ...prev, price: { ...prev.price, min: val } }));
  const setPriceMax = (val: number) => setPendingFilters((prev) => ({ ...prev, price: { ...prev.price, max: val } }));
  const setPriceRange = (val: number) => setPendingFilters((prev) => ({ ...prev, price: { ...prev.price, max: val } }));
  const hasSelections = useMemo(() => {
    const hasList =
      pendingFilters.categories.length ||
      pendingFilters.colors.length ||
      pendingFilters.discounts.length ||
      pendingFilters.ratings.length ||
      pendingFilters.availability.length ||
      pendingFilters.sizes.length ||
      pendingFilters.fabrics.length;
    const priceChanged =
      priceBounds.max > priceBounds.min &&
      (pendingFilters.price.min !== priceBounds.min || pendingFilters.price.max !== priceBounds.max);
    return Boolean(hasList || priceChanged);
  }, [pendingFilters, priceBounds]);
  const applyFilters = () => {
    if (!hasSelections) return;
    setAppliedFilters(pendingFilters);
  };
  const clearFilters = () => {
    const reset = {
      ...emptyFilters,
      price: { min: priceBounds.min, max: priceBounds.max },
    } as FiltersState;
    setPendingFilters(reset);
    setAppliedFilters(reset);
  };
  const collectionTitle = useMemo(() => {
    const parts = ["Collection"];
    const { category, sub, child, collection } = query;
    if (category || sub || child) {
      [category, sub, child].forEach((p) => {
        if (p) parts.push(p);
      });
      return parts.join(" / ");
    }
    if (collection) {
      parts.push(collection);
      return parts.join(" / ");
    }

    if (slugKey && slugKey !== "all") {
      const pretty = slugKey
        .split("-")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");
      parts.push(pretty);
    }
    return parts.join(" / ");
  }, [query, slugKey]);

  const slugFilteredProducts = useMemo(() => {
    let base = productsData;
    const lower = slugKey.toLowerCase();
    const parts = slugParts;

    if (lower === "best-seller" && topProductsData.length) {
      base = topProductsData;
    }

    const matchesGender = (p: CardProduct, gender: "men" | "women") => {
      const target = gender.toLowerCase();
      return (
        p.category?.toLowerCase().includes(target) ||
        p.categoryPath.some((c) => c.toLowerCase().includes(target)) ||
        p.title.toLowerCase().includes(target)
      );
    };

    const matchesKeyword = (p: CardProduct, keyword: string) => {
      const key = keyword.toLowerCase();
      return (
        p.category?.toLowerCase().includes(key) ||
        p.categoryPath.some((c) => c.toLowerCase().includes(key)) ||
        p.title.toLowerCase().includes(key) ||
        (p.fabric || "").toLowerCase().includes(key)
      );
    };

    let filtered = base;
    const isMenSlug = parts.some((p) => ["men", "menwear", "mens", "male", "boys"].includes(p));
    const isWomenSlug = parts.some((p) =>
      ["women", "womens", "womenwear", "ladies", "female", "girl", "girls"].includes(p),
    );

    if (isMenSlug) {
      filtered = filtered.filter((p) => matchesGender(p, "men") && !matchesGender(p, "women"));
    }
    if (isWomenSlug) {
      filtered = filtered.filter((p) => matchesGender(p, "women") && !matchesGender(p, "men"));
      if (!filtered.length) {
        const keys = ["women", "womens", "womenwear", "ladies", "female", "girl", "girls"];
        filtered = base.filter((p) => keys.some((k) => matchesKeyword(p, k)));
      }
    }

    if (parts.includes("top")) {
      filtered = filtered.filter((p) => matchesKeyword(p, "top"));
    }
    if (parts.includes("bottom")) {
      filtered = filtered.filter((p) => matchesKeyword(p, "bottom"));
    }

    if (lower === "shirts") {
      filtered = filtered.filter((p) => isShirt(p));
    }
    if (lower === "t-shirts" || lower === "tshirt" || lower === "tshirts") {
      filtered = filtered.filter((p) => isTshirt(p));
    }
    if (lower === "jeans") {
      filtered = filtered.filter((p) => isJeansProduct(p));
    }
    if (lower === "kurta" || lower === "kurtas") {
      filtered = filtered.filter((p) => isKurtaProduct(p));
    }
    if (lower === "cotton") {
      filtered = filtered.filter((p) => isCotton(p));
    }
    if (lower === "summer") {
      const summerMatch = filtered.filter((p) => isSummerProduct(p));
      filtered = summerMatch.length ? summerMatch : filtered;
    }
    if (lower === "high-rated") {
      const strongRated = filtered.filter((p) => (p.rating || 0) >= 4.2);
      const anyRated = strongRated.length ? strongRated : filtered.filter((p) => (p.rating || 0) > 0);
      filtered = anyRated.length ? anyRated : filtered;
    }
    if (lower === "deals") {
      filtered = filtered.filter((p) => discount(p.price, p.mrp) >= 30);
    }

    return filtered;
  }, [productsData, topProductsData, slugKey, slugParts, discount]);

  const filteredProducts = useMemo(() => {
    const selectedCatKeys = buildVariants(query.category);
    const selectedSubKeys = buildVariants(query.sub);
    const selectedChildKeys = buildVariants(query.child);
    const requiresPathFilter = Boolean(selectedCatKeys.length || selectedSubKeys.length || selectedChildKeys.length);

    return slugFilteredProducts.filter((p) => {
      if (requiresPathFilter) {
        const path = dedupe([...(p.categoryPath || []), p.category || ""]).filter(Boolean);
        const pathKeys = path.map(normalizeName).filter(Boolean);
        const matchesAny = (keys: string[], selectedKeys: string[]) =>
          selectedKeys.length === 0 ||
          keys.some((k) => selectedKeys.some((s) => k.includes(s) || s.includes(k)));
        if (!matchesAny(pathKeys, selectedCatKeys)) return false;
        if (!matchesAny(pathKeys, selectedSubKeys)) return false;
        if (!matchesAny(pathKeys, selectedChildKeys)) return false;
      }
      const d = discount(p.price, p.mrp);
      if (appliedFilters.categories.length && !appliedFilters.categories.includes(p.category || "")) return false;
      if (appliedFilters.colors.length && !appliedFilters.colors.some((c) => p.colors.includes(c))) return false;
      if (appliedFilters.sizes.length && !appliedFilters.sizes.some((s) => p.sizes.includes(s))) return false;
      if (appliedFilters.fabrics.length && !appliedFilters.fabrics.includes(p.fabric || "")) return false;
      if (appliedFilters.availability.length) {
        const wantedInStock = appliedFilters.availability.includes("In stock");
        const wantedOut = appliedFilters.availability.includes("Out of stock");
        if (p.inStock && !wantedInStock) return false;
        if (!p.inStock && !wantedOut) return false;
      }
      if (appliedFilters.ratings.length) {
        const minRating = Math.min(...appliedFilters.ratings);
        if (!p.rating || p.rating < minRating) return false;
      }
      if (appliedFilters.discounts.length) {
        const minDiscount = Math.min(...appliedFilters.discounts);
        if (d < minDiscount) return false;
      }
      if (priceBounds.max > priceBounds.min) {
        if (p.price < appliedFilters.price.min || p.price > appliedFilters.price.max) return false;
      }
      return true;
    });
  }, [appliedFilters, discount, priceBounds, query, slugFilteredProducts]);

  const sortedProducts = useMemo(() => {
    const next = [...filteredProducts];
    if (activeSort === "Price -- Low to High") {
      next.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (activeSort === "Price -- High to Low") {
      next.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (activeSort === "Newest First") {
      next.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } else if (activeSort === "Popularity") {
      if (slugKey === "best-seller") {
        next.sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0));
      } else {
        next.sort((a, b) => {
          const scoreA = (a.rating || 0) * (Number(a.reviews) || 0);
          const scoreB = (b.rating || 0) * (Number(b.reviews) || 0);
          return scoreB - scoreA;
        });
      }
    }
    return next;
  }, [filteredProducts, activeSort, slugKey]);

  const handleSelectProduct = (product: CardProduct) => {
    const selectedColor = appliedFilters.colors.find((c) => product.colors.includes(c)) || product.colors[0] || "";
    const selectedSize = appliedFilters.sizes.find((s) => product.sizes.includes(s)) || product.sizes[0] || "";
    router.push(
      buildProductHref({
        id: product.id,
        name: product.title || product.name || `product-${product.id}`,
        color: selectedColor,
        size: selectedSize,
      }),
    );
  };

  return {
    sortOptions,
    collectionTitle,
    activeSort,
    setActiveSort,
    openSections,
    toggleSection,
    pendingFilters,
    availableFilters,
    priceBounds,
    setPriceMin,
    setPriceMax,
    setPriceRange,
    toggleValue,
    hasSelections,
    applyFilters,
    clearFilters,
    isLoading,
    sortedProducts,
    discount,
    handleSelectProduct,
  };
}
