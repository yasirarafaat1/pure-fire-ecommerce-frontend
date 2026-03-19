"use client";

import { Suspense, useMemo, useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FaStar } from "react-icons/fa";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
import CategoryStrip from "../../home/components/category-strip";
import HoverImage from "../../components/HoverImage";

const sortOptions = ["Popularity", "Price -- Low to High", "Price -- High to Low", "Newest First"];

const IconClose = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

type CardProduct = {
  id: string | number;
  title: string;
  price: number;
  mrp: number;
  image: string;
  images: string[];
  rating?: number;
  reviews?: string | number;
  category?: string;
  categoryPath: string[];
  colors: string[];
  sizes: string[];
  fabric?: string;
  inStock: boolean;
  createdAt?: number;
  orderCount?: number;
};

type FiltersState = {
  categories: string[];
  colors: string[];
  discounts: number[];
  ratings: number[];
  availability: string[];
  sizes: string[];
  fabrics: string[];
  price: { min: number; max: number };
};

const toNum = (val: any) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
};

const dedupe = <T,>(items: T[]) => Array.from(new Set(items));

const getFabricValue = (item: any) => {
  const all = [...(item?.key_highlights || []), ...(item?.specifications || [])];
  const hit = all.find((h: any) => String(h?.key || "").toLowerCase().includes("fabric"));
  return hit?.value ? String(hit.value) : "";
};

function CollectionsPage() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const [query, setQuery] = useState({ category: "", sub: "", child: "", collection: "" });
  const [activeSort, setActiveSort] = useState(sortOptions[0]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    category: false,
    price: false,
    color: false,
    size: false,
    fabric: false,
    discount: false,
    rating: false,
    availability: false,
  });
  const [availableFilters, setAvailableFilters] = useState({
    categories: [] as string[],
    colors: [] as string[],
    discounts: [] as number[],
    ratings: [] as number[],
    availability: [] as string[],
    sizes: [] as string[],
    fabrics: [] as string[],
  });
  const [productsData, setProductsData] = useState<CardProduct[]>([]);
  const [topProductsData, setTopProductsData] = useState<CardProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [priceBounds, setPriceBounds] = useState({ min: 0, max: 0 });
  const priceInitRef = useRef(false);

  const [pendingFilters, setPendingFilters] = useState<FiltersState>({
    categories: [],
    colors: [],
    discounts: [],
    ratings: [],
    availability: [],
    sizes: [],
    fabrics: [],
    price: { min: 0, max: 0 },
  });
  const [appliedFilters, setAppliedFilters] = useState<FiltersState>(pendingFilters);

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
    let active = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const [prodRes, catRes, topRes] = await Promise.all([
          fetch("/api/user/show-product?page=1&limit=100"),
          fetch("/api/user/get-categories"),
          fetch("/api/user/top-products"),
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
              ...variants.flatMap((v: any) => (Array.isArray(v?.sizes) ? v.sizes.map((s: any) => s?.label) : [])),
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
          const orderCount = toNum(p?.orderedQty ?? p?.orders ?? p?.totalOrders ?? p?.orderCount ?? 0);
          const reviews = p?.reviewCount ?? p?.reviews;

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
            inStock,
            createdAt: p.createdAt ? new Date(p.createdAt).getTime() : undefined,
            orderCount,
          };
        };

        const mapped: CardProduct[] = (prodJson.products || [])
          .filter((p: any) => !p?.status || p.status === "published")
          .map((p: any) => shapeProduct(p));

        const topMapped: CardProduct[] = (topJson.products || [])
          .filter((p: any) => !p?.status || p.status === "published")
          .map((p: any) => shapeProduct(p));

        const priceValues = mapped.map((p) => p.price || p.mrp).filter((n) => Number.isFinite(n) && n > 0) as number[];
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
      } catch (error) {
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

  useEffect(() => {
    if (priceInitRef.current) return;
    if (priceBounds.max <= priceBounds.min) return;
    priceInitRef.current = true;
    setPendingFilters((prev) => ({ ...prev, price: { min: priceBounds.min, max: priceBounds.max } }));
    setAppliedFilters((prev) => ({ ...prev, price: { min: priceBounds.min, max: priceBounds.max } }));
  }, [priceBounds]);

  const discount = useMemo(() => (price: number, mrp: number) => {
    if (!mrp || mrp <= price) return 0;
    return Math.round(((mrp - price) / mrp) * 100);
  }, []);

  const toggle = (key: string) => setOpenSections((s) => ({ ...s, [key]: !s[key] }));

  const toggleValue = <T,>(key: keyof FiltersState, value: T) => {
    setPendingFilters((prev) => {
      const list = prev[key] as T[];
      const exists = list.includes(value as any);
      const next = exists ? list.filter((v) => v !== (value as any)) : [...list, value as any];
      return { ...prev, [key]: next } as FiltersState;
    });
  };

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
      categories: [],
      colors: [],
      discounts: [],
      ratings: [],
      availability: [],
      sizes: [],
      fabrics: [],
      price: { min: priceBounds.min, max: priceBounds.max },
    } as FiltersState;
    setPendingFilters(reset);
    setAppliedFilters(reset);
  };

  const slugKey = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("collections");
    return idx >= 0 ? parts[idx + 1] || "all" : "all";
  }, [pathname]);

  const slugParts = useMemo(() => slugKey.toLowerCase().split("-").filter(Boolean), [slugKey]);

  const selectedCategory = query.category;
  const selectedSub = query.sub;
  const selectedChild = query.child;

  const normalizeName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
  const buildVariants = (value: string) => {
    const key = normalizeName(value);
    if (!key) return [];
    const singular = key.endsWith("s") ? key.slice(0, -1) : key;
    return dedupe([key, singular].filter(Boolean));
  };

  const collectionTitle = useMemo(() => {
    const parts = ["Collection"];
    const collection = query.collection;
    const category = query.category;
    const sub = query.sub;
    const child = query.child;
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

  useEffect(() => {
    if (slugKey === "new-arrival") {
      setActiveSort("Newest First");
    } else if (slugKey === "best-seller") {
      setActiveSort("Popularity");
    } else if (slugKey === "high-rated") {
      setActiveSort("Popularity");
    }
  }, [slugKey]);

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

    const getPathText = (p: CardProduct) =>
      [p.category, ...(p.categoryPath || [])].filter(Boolean).join(" ").toLowerCase();
    const hasCategory = (p: CardProduct, keys: string[]) =>
      keys.some((k) => getPathText(p).includes(k));
    const isTshirt = (p: CardProduct) => hasCategory(p, ["t-shirt", "tshirt"]);
    const isShirt = (p: CardProduct) => hasCategory(p, ["shirt"]) && !isTshirt(p);
    const isCotton = (p: CardProduct) => (p.fabric || "").toLowerCase().includes("cotton");
    const isHalfSleeve = (p: CardProduct) => {
      const t = p.title.toLowerCase();
      return (
        t.includes("half sleeve") ||
        t.includes("half sleeves") ||
        t.includes("half-sleeve") ||
        t.includes("half-sleeves")
      );
    };

    let filtered = base;

    if (parts.includes("men") || parts.includes("menwear") || parts.includes("mens")) {
      filtered = filtered.filter((p) => matchesGender(p, "men") && !matchesGender(p, "women"));
    }
    if (parts.includes("women") || parts.includes("womens")) {
      filtered = filtered.filter((p) => matchesGender(p, "women") && !matchesGender(p, "men"));
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
      filtered = filtered.filter((p) => matchesKeyword(p, "jean"));
    }
    if (lower === "cotton") {
      filtered = filtered.filter((p) => isCotton(p));
    }
    if (lower === "summer") {
      const summerMatch = filtered.filter((p) => isTshirt(p) && isCotton(p) && isHalfSleeve(p));
      filtered = summerMatch.length ? summerMatch : filtered.filter((p) => isTshirt(p) && isCotton(p));
    }
    if (lower === "high-rated") {
      filtered = filtered.filter((p) => (p.rating || 0) >= 4.2);
    }
    if (lower === "deals") {
      filtered = filtered.filter((p) => discount(p.price, p.mrp) >= 30);
    }

    return filtered;
  }, [productsData, topProductsData, slugKey, slugParts, discount]);

  const filteredProducts = useMemo(() => {
    const selectedCatKeys = buildVariants(selectedCategory);
    const selectedSubKeys = buildVariants(selectedSub);
    const selectedChildKeys = buildVariants(selectedChild);
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
  }, [
    appliedFilters,
    discount,
    priceBounds,
    slugFilteredProducts,
    selectedCategory,
    selectedSub,
    selectedChild,
  ]);

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

  const FilterContent = (
    <>
      <style jsx>{`
        @media (min-width: 768px) {
          .mobile-only {
            display: none !important;
          }
        }
      `}</style>
      <div className="flex items-center justify-between border-b border-black/10 pb-3 mb-3">
        <h3 className="text-lg font-semibold">Filters</h3>
        <button className="mobile-only btn btn-ghost px-3 py-1" onClick={() => setMobileFilterOpen(false)}>
          <IconClose />
        </button>
      </div>

      <div className="grid gap-2 border-b border-black/10 pb-3">
        <button className="w-full cursor-pointer flex items-center justify-between text-left" onClick={() => toggle("category")}>
          <span className="text-sm font-semibold">Categories</span>
          <span className="text-[var(--muted)]">{openSections.category ? <IoChevronUp /> : <IoChevronDown />}</span>
        </button>
        {openSections.category && (
          <div className="grid gap-1 text-sm">
            {availableFilters.categories.map((c) => (
              <label key={c} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-black" checked={pendingFilters.categories.includes(c)} onChange={() => toggleValue("categories", c)} />
                <span>{c}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-3 border-b border-black/10 pb-3">
        <button className="w-full cursor-pointer flex items-center justify-between text-left" onClick={() => toggle("price")}>
          <span className="text-sm font-semibold">Price</span>
          <span className="text-[var(--muted)]">{openSections.price ? <IoChevronUp /> : <IoChevronDown />}</span>
        </button>
        {openSections.price && (
          <div className="grid gap-3">
            <input
              type="range"
              className="accent-black cursor-pointer"
              min={priceBounds.min}
              max={priceBounds.max}
              value={pendingFilters.price.max}
              onChange={(e) => setPendingFilters((p) => ({ ...p, price: { ...p.price, max: Number(e.target.value) } }))}
            />
            <div className="flex items-center gap-2 text-sm">
              <div className="flex-1 border border-black/20 rounded-[5px] px-3 py-2 flex items-center gap-2">
                <span>₹</span>
                <input
                  className="w-full outline-none"
                  type="number"
                  value={pendingFilters.price.min}
                  onChange={(e) => setPendingFilters((p) => ({ ...p, price: { ...p.price, min: Number(e.target.value) } }))}
                />
              </div>
              <span>to</span>
              <div className="flex-1 border border-black/20 rounded-[5px] px-3 py-2 flex items-center gap-2">
                <span>₹</span>
                <input
                  className="w-full outline-none"
                  type="number"
                  value={pendingFilters.price.max}
                  onChange={(e) => setPendingFilters((p) => ({ ...p, price: { ...p.price, max: Number(e.target.value) } }))}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-2 border-b border-black/10 pb-3">
        <button className="w-full cursor-pointer flex items-center justify-between text-left" onClick={() => toggle("color")}>
          <span className="text-sm font-semibold">Color</span>
          <span className="text-[var(--muted)]">{openSections.color ? <IoChevronUp /> : <IoChevronDown />}</span>
        </button>
        {openSections.color && (
          <div className="flex flex-wrap gap-2">
            {availableFilters.colors.map((c) => (
              <button
                key={c}
                className={`w-7 h-7 cursor-pointer rounded-full border ${pendingFilters.colors.includes(c) ? "border-black" : "border-black/20"}`}
                style={{ background: c }}
                onClick={() => toggleValue("colors", c)}
                aria-label={c}
              />
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-2 border-b border-black/10 pb-3">
        <button className="w-full cursor-pointer flex items-center justify-between text-left" onClick={() => toggle("size")}>
          <span className="text-sm font-semibold">Size</span>
          <span className="text-[var(--muted)]">{openSections.size ? <IoChevronUp /> : <IoChevronDown />}</span>
        </button>
        {openSections.size && (
          <div className="flex flex-wrap gap-2">
            {availableFilters.sizes.map((s) => (
              <button
                key={s}
                className={`px-3 py-1 cursor-pointer border rounded-[5px] text-xs ${pendingFilters.sizes.includes(s) ? "border-black" : "border-black/20"}`}
                onClick={() => toggleValue("sizes", s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-2 border-b border-black/10 pb-3">
        <button className="w-full cursor-pointer flex items-center justify-between text-left" onClick={() => toggle("fabric")}>
          <span className="text-sm font-semibold">Fabric</span>
          <span className="text-[var(--muted)]">{openSections.fabric ? <IoChevronUp /> : <IoChevronDown />}</span>
        </button>
        {openSections.fabric && (
          <div className="grid gap-1 text-sm">
            {availableFilters.fabrics.map((f) => (
              <label key={f} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-black cursor-pointer" checked={pendingFilters.fabrics.includes(f)} onChange={() => toggleValue("fabrics", f)} />
                <span>{f}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-2 border-b border-black/10 pb-3">
        <button className="w-full cursor-pointer flex items-center justify-between text-left" onClick={() => toggle("discount")}>
          <span className="text-sm font-semibold">Discount</span>
          <span className="text-[var(--muted)]">{openSections.discount ? <IoChevronUp /> : <IoChevronDown />}</span>
        </button>
        {openSections.discount && (
          <div className="grid gap-1 text-sm">
            {availableFilters.discounts.map((d) => (
              <label key={d} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-black cursor-pointer" checked={pendingFilters.discounts.includes(d)} onChange={() => toggleValue("discounts", d)} />
                <span>{d}%</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-2 border-b border-black/10 pb-3">
        <button className="w-full cursor-pointer flex items-center justify-between text-left" onClick={() => toggle("rating")}>
          <span className="text-sm font-semibold">Rating</span>
          <span className="text-[var(--muted)]">{openSections.rating ? <IoChevronUp /> : <IoChevronDown />}</span>
        </button>
        {openSections.rating && (
          <div className="grid gap-1 text-sm">
            {availableFilters.ratings.map((r) => (
              <label key={r} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-black cursor-pointer" checked={pendingFilters.ratings.includes(r)} onChange={() => toggleValue("ratings", r)} />
                <span className="flex items-center gap-1">
                  {r}
                  <FaStar className="text-[#000]" />
                  <span>&amp; above</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <button className="btn btn-primary flex-1" disabled={!hasSelections} onClick={applyFilters}>
          Apply
        </button>
        <button className="btn btn-ghost flex-1" disabled={!hasSelections} onClick={clearFilters}>
          Clear
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-white text-black">
      <CategoryStrip />
      <main className="max-w-6xl mx-auto px-4 py-6 pt-3 grid gap-6">
        <header className="grid gap-3 max-w-full overflow-x-hidden">
          <h1 className="text-md font-semibold">{collectionTitle}</h1>
          <div className="flex items-center gap-4 text-sm border-b border-black/10 pb-2 max-w-full min-w-0">
            <span className="text-[var(--muted)] pb-2 shrink-0">Sort By</span>
            <div className="flex-1 overflow-x-auto snap-x snap-mandatory scroll-smooth min-w-0">
              <div className="flex gap-4 min-w-max whitespace-nowrap">
                {sortOptions.map((opt) => {
                  const active = activeSort === opt;
                  return (
                    <button
                      key={opt}
                      className={`px-1 pb-2 border-b-2 cursor-pointer ${active ? "border-black text-black font-semibold" : "border-transparent text-[var(--muted)]"}`}
                      onClick={() => setActiveSort(opt)}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
            <button className="inline-flex md:!hidden btn btn-ghost px-3 py-1 shrink-0" onClick={() => setMobileFilterOpen(true)}>
              Filter
            </button>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-[280px_1fr] items-start">
          <aside className="hidden md:grid md:self-start md:sticky md:top-24 md:max-h-[calc(100vh-6rem)] px-2 gap-4 bg-white text-black">
            {FilterContent}
          </aside>

          <section className="grid gap-4">
            {isLoading ? (
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
            ) : sortedProducts.length === 0 ? (
              <div className="border border-black/10 rounded-[5px] p-10 text-center text-sm text-[var(--muted)]">
                No items found. Try clearing some filters.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {sortedProducts.map((p) => (
                  <div
                    key={p.id}
                    className="overflow-hidden cursor-pointer bg-white"
                    onClick={() => {
                      const selectedColor =
                        appliedFilters.colors.find((c) => p.colors.includes(c)) || p.colors[0] || "";
                      const selectedSize =
                        appliedFilters.sizes.find((s) => p.sizes.includes(s)) || p.sizes[0] || "";
                      const params = new URLSearchParams();
                      params.set("id", String(p.id));
                      if (selectedColor) params.set("color", selectedColor);
                      if (selectedSize) params.set("size", selectedSize);
                      router.push(`/product?${params.toString()}`);
                    }}
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
                        <span className="font-semibold">₹{p.price}</span>
                        <span className="text-xs text-red-400 line-through">₹{p.mrp}</span>
                        {discount(p.price, p.mrp) > 0 && (
                          <span className="text-xs font-semibold text-green-700">{discount(p.price, p.mrp)}% off</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
          mobileFilterOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!mobileFilterOpen}
      >
        <button
          className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${
            mobileFilterOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileFilterOpen(false)}
          aria-label="Close filters"
        />
        <aside
          className={`absolute right-0 top-0 h-full w-[86%] max-w-sm bg-white text-black border-l border-black/10 p-4 overflow-y-auto transform transition-transform duration-300 ${
            mobileFilterOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="grid gap-4">{FilterContent}</div>
        </aside>
      </div>
    </div>
  );
}

export default function CollectionsPageWrapper() {
  return (
    <Suspense fallback={null}>
      <CollectionsPage />
    </Suspense>
  );
}






