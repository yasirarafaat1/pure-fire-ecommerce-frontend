"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import namer from "color-namer";
import Gallery from "./components/Gallery";
import InfoPanel from "./components/InfoPanel";
import ProductRail from "./components/ProductRail";
import Reviews from "./components/Reviews";
import { getUserEmail, getUserToken } from "../utils/auth";

const API_BASE = "/api/user";
const getToken = () => getUserToken();

export default function ProductPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [productId, setProductId] = useState<string | undefined>(undefined);
  const [colorParam, setColorParam] = useState<string | null>(null);
  const [sizeParam, setSizeParam] = useState<string | null>(null);
  const [queryString, setQueryString] = useState("");
  const lastSearchRef = useRef("");
  const nextUrl = useMemo(
    () => (queryString ? `${pathname}?${queryString}` : pathname),
    [pathname, queryString],
  );

  const leftRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);
  const [stick, setStick] = useState<"left" | "right" | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const search = window.location.search || "";
    if (search === lastSearchRef.current) return;
    lastSearchRef.current = search;
    const params = new URLSearchParams(search);
    setProductId(params.get("id") || undefined);
    setColorParam(params.get("color"));
    setSizeParam(params.get("size"));
    setQueryString(params.toString());
  });

  const [product, setProduct] = useState<any | null>(null);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  const requireAuth = () => {
    const token = getToken();
    if (!token) {
      router.push(`/login?next=${encodeURIComponent(nextUrl || "/")}`);
      return false;
    }
    return true;
  };
  const normalizeProduct = (raw: any) => {
    if (!raw) return null;
    const parseList = (val: any) => {
      if (Array.isArray(val)) return val.filter(Boolean);
      if (typeof val === "string") {
        return val
          .split(/[,\s]+/)
          .map((v) => v.trim())
          .filter(Boolean);
      }
      return [];
    };
    const variantImages =
      typeof raw?.colorVariants?.[0]?.images === "string"
        ? raw.colorVariants[0].images.split(" ").filter(Boolean)
        : Array.isArray(raw?.colorVariants?.[0]?.images)
          ? raw.colorVariants[0].images
          : [];
    const variants = (raw.colorVariants || []).map((v: any) => {
      const vMrpRaw = v.price ?? raw.mrp ?? raw.price ?? 0;
      const vDiscountRaw =
        v.discountedPrice ?? raw.selling_price ?? raw.discountedPrice ?? v.price ?? raw.price ?? 0;
      const vSafeMrp = Math.max(vMrpRaw, vDiscountRaw);
      const vSafeDiscount = Math.min(vMrpRaw, vDiscountRaw);
      return {
        color: v.color,
        images: typeof v.images === "string" ? v.images.split(" ").filter(Boolean) : v.images || [],
        video: v.video,
        mrp: vSafeMrp,
        discountedPrice: vSafeDiscount,
        price: vSafeMrp,
        sizes: parseList(v.sizes).length > 0 ? parseList(v.sizes) : parseList(raw.sizes),
      };
    });
    const mrpRaw = raw.mrp ?? raw.price ?? 0;
    const discountRaw = raw.selling_price ?? raw.discountedPrice ?? mrpRaw;
    const safeMrp = Math.max(mrpRaw, discountRaw);
    const safeDiscount = Math.min(mrpRaw, discountRaw);
    return {
      ...raw,
      images: raw.images || raw.product_image || variantImages || [],
      video: raw.video || raw.video_url || raw?.colorVariants?.[0]?.video || "",
      variants,
      category:
        raw.category ||
        raw.category_name ||
        raw?.Catagory?.name ||
        raw?.Catagory?.title ||
        "",
      price: safeMrp,
      discountedPrice: safeDiscount,
      mrp: safeMrp,
    };
  };
  const colorNameFromHex = useMemo(
    () => (input: string) => {
      const raw = (input || "").trim();
      if (!raw) return "Custom";
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
    },
    [],
  );

  useEffect(() => {
    const measure = () => {
      const l = leftRef.current;
      const r = rightRef.current;
      if (!l || !r) return;
      const lh = l.scrollHeight;
      const rh = r.scrollHeight;
      if (lh > rh + 40) setStick("right");
      else if (rh > lh + 40) setStick("left");
      else setStick(null);
    };
    measure();
    const id = setInterval(measure, 400);
    window.addEventListener("resize", measure);
    return () => {
      clearInterval(id);
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const listRes = await fetch(`${API_BASE}/show-product`);
        const listData = await listRes.json();
        const list = listData?.products || listData?.data || [];
        const first = list?.[0];
        if (!first) return;
        const id = productId || first._id || first.product_id;

        const detailRes = await fetch(`${API_BASE}/get-product-byid/${id}`);
        const detailData = await detailRes.json();
        const detail = detailData?.data?.[0] || detailData?.product || detailData?.data;
        const prod = normalizeProduct(detail || first);
        setProduct(prod);
        setSelectedColor(colorParam || prod?.variants?.[0]?.color || prod?.colors?.[0] || null);
        if (sizeParam) setSelectedSize(sizeParam);

        setRecentlyViewed((list || []).slice(0, 8).map(normalizeProduct));

        if (prod?.category) {
          const simRes = await fetch(`${API_BASE}/get-product-byCategory/${prod.category}`);
          const simData = await simRes.json();
          const simList = simData?.data || simData?.products || [];
          setSimilarProducts(
            simList
              .map(normalizeProduct)
              .filter((p: any) => p?._id !== id && p?.product_id !== id)
              .slice(0, 8),
          );
        }

        const revRes = await fetch(`${API_BASE}/get-product-reviews/${id}`);
        const revData = await revRes.json();
        setReviews(revData?.reviews || revData?.data || []);

        const cartId = localStorage.getItem("cart_id") || "";
        if (cartId && prod?.product_id) {
          const cartRes = await fetch(`${API_BASE}/get-user-cart`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cart_id: cartId }),
          });
          const cartData = await cartRes.json();
          setCartItems(cartData?.items || []);
        } else {
          setCartItems([]);
        }

        const token = getToken();
        if (token) {
          const email = (localStorage.getItem("user_email") || "guest@purefire.local").trim();
          localStorage.setItem("user_email", email);
          const wishRes = await fetch(`${API_BASE}/wishlist/list`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-user-token": token },
            body: JSON.stringify({ email }),
          });
          const wishData = await wishRes.json();
          const ids = new Set<string>(
            (wishData?.products || []).map((p: any) => String(p.product_id || p._id || "")),
          );
          setWishlistIds(ids);
        } else {
          setWishlistIds(new Set<string>());
        }
      } catch (err) {
        console.error("product fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productId, colorParam, sizeParam]);

  useEffect(() => {
    if (!product?.product_id) return;
    const token = getToken();
    if (!token) return;
    fetch(`${API_BASE}/activity/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-token": token },
      body: JSON.stringify({ product_id: product.product_id }),
    }).catch(() => { });
  }, [product?.product_id]);

  const breadcrumbs =
    product?.breadcrumbs ||
    [
      { label: "Home", href: "/" },
      product?.category ? { label: product.category, href: `/category/${product.category}` } : null,
      { label: product?.name || "Product" },
    ].filter(Boolean);

  const currentVariant =
    selectedColor && product?.variants?.length
      ? product.variants.find((v: any) => v.color === selectedColor)
      : product?.variants?.[0];
  const displayImages =
    currentVariant?.images && currentVariant.images.length > 0 ? currentVariant.images : product?.images || [];
  const displayVideo = currentVariant?.video || product?.video || "";
  const displaySizes = useMemo(() => {
    const base =
      currentVariant?.sizes && currentVariant.sizes.length > 0 ? currentVariant.sizes : product?.sizes || [];
    return (Array.isArray(base) ? base : [])
      .map((s: any) => (typeof s === "string" ? s : s?.label || s?.size || String(s)))
      .filter((s: any) => s && s !== "[object Object]");
  }, [currentVariant?.sizes, product?.sizes]);
  const displaySizesKey = useMemo(() => displaySizes.join("|"), [displaySizes]);
  useEffect(() => {
    if (!displaySizes.length) {
      if (selectedSize !== null) setSelectedSize(null);
      return;
    }
    if (!selectedSize || !displaySizes.includes(selectedSize)) {
      setSelectedSize(displaySizes[0]);
    }
  }, [displaySizesKey, selectedColor, selectedSize]);
  const displayPrice =
    currentVariant?.discountedPrice ?? product?.discountedPrice ?? product?.price ?? 0;
  const displayMrp = currentVariant?.mrp ?? product?.mrp ?? product?.price ?? 0;
  const colorOptions =
    product?.variants?.length > 0
      ? product.variants.map((v: any) => ({ name: colorNameFromHex(v.color), swatch: v.color }))
      : (product?.colors || []).map((c: any) => ({ name: colorNameFromHex(c), swatch: c }));
  const variantCards =
    product?.variants?.length > 0
      ? product.variants
        .filter((v: any) => v.color && v.color !== selectedColor)
        .map((v: any) => ({
          id: product.product_id || product._id,
          color: v.color,
          title: product.name,
          price: v.discountedPrice ?? product.discountedPrice ?? product.price,
          mrp: v.mrp ?? product.mrp ?? product.price,
          image: (v.images && v.images[0]) || product.images?.[0] || "",
          images: v.images || [],
        }))
      : [];
  const uniqueSimilarProducts = similarProducts.filter((p: any, idx: number, arr: any[]) => {
    const key = String(p.product_id || p._id || "");
    return arr.findIndex((x) => String(x.product_id || x._id || "") === key) === idx;
  });
  const similarCardsRaw = uniqueSimilarProducts.flatMap((p: any) => {
    if (p?.variants?.length) {
      return p.variants.map((v: any) => ({
        id: p.product_id || p._id,
        color: v.color,
        title: p.name,
        price: v.discountedPrice ?? p.discountedPrice ?? p.selling_price ?? p.price,
        mrp: v.mrp ?? p.mrp ?? p.price,
        image: (v.images && v.images[0]) || p.images?.[0] || "",
        images: v.images || [],
        badge: p.discount ? `${p.discount}% OFF` : undefined,
      }));
    }
    return [
      {
        id: p.product_id || p._id,
        title: p.name,
        price: p.discountedPrice ?? p.selling_price ?? p.price,
        mrp: p.mrp ?? p.price,
        image: p.images?.[0] || "",
        images: p.images || [],
        badge: p.discount ? `${p.discount}% OFF` : undefined,
      },
    ];
  });
  const similarCards = similarCardsRaw
    .filter((card: any) => {
      if (!selectedColor) return true;
      const sameProduct =
        String(card.id) === String(product?.product_id || product?._id);
      return !(sameProduct && card.color && card.color === selectedColor);
    })
    .filter((card: any, _i: number, arr: any[]) => {
      const hasVariantForId = arr.some(
        (c) => String(c.id) === String(card.id) && c.color,
      );
      return !(hasVariantForId && !card.color);
    })
    .filter((card: any, index: number, arr: any[]) => {
      const key = `${card.id}-${card.color || "base"}`;
      return arr.findIndex((c) => `${c.id}-${c.color || "base"}` === key) === index;
    });
  const combinedSimilar = [...variantCards, ...similarCards].filter((card: any, index: number, arr: any[]) => {
    const key = `${card.id}-${card.color || "base"}`;
    return arr.findIndex((c) => `${c.id}-${c.color || "base"}` === key) === index;
  });
  const reviewCount = reviews.length || product?.reviewCount || 0;
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r: any) => sum + Number(r.review_rate ?? r.rating ?? 0), 0) / reviews.length
      : product?.avgRating || 0;
  const addToCart = async ({ color, size }: { color: string; size: string }) => {
    if (!product?.product_id) return;
    const cartId = localStorage.getItem("cart_id") || "";
    const payload = {
      cart_id: cartId,
      product_id: product.product_id,
      color,
      size,
      qty: 1,
      price: displayPrice,
      mrp: displayMrp,
      title: product.name,
      image: displayImages?.[0] || "",
    };
    const res = await fetch(`${API_BASE}/add-to-cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data?.cart_id) localStorage.setItem("cart_id", data.cart_id);
    if (data?.items) {
      setCartItems(data.items);
    }
    window.dispatchEvent(new Event("cart:updated"));
  };

  const saveBuyNowItem = (color: string, size: string) => {
    if (!product?.product_id) return;
    const payload = {
      product_id: product.product_id,
      title: product.name,
      qty: 1,
      price: displayPrice,
      mrp: displayMrp,
      image: displayImages?.[0] || "",
      color,
      size,
    };
    localStorage.setItem("buy_now_item", JSON.stringify(payload));
  };

  const toggleWishlist = async () => {
    if (!requireAuth()) return;
    if (!product?.product_id) return;
    const email = (localStorage.getItem("user_email") || "guest@purefire.local").trim();
    localStorage.setItem("user_email", email);
    const isWishlisted = wishlistIds.has(String(product.product_id));
    const endpoint = isWishlisted ? "/wishlist/remove" : "/wishlist/add";
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-token": getToken() },
        body: JSON.stringify({ email, product_id: product.product_id }),
      });
      const data = await res.json();
      const ids = new Set<string>(
        (data?.products || []).map((p: any) => String(p.product_id || p._id || "")),
      );
      setWishlistIds(ids);
      window.dispatchEvent(new Event("wishlist:updated"));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!product?.product_id || !selectedColor || !selectedSize) {
      setAddedToCart(false);
      return;
    }
    const exists = cartItems.some(
      (i: any) =>
        String(i.product_id) === String(product.product_id) &&
        String(i.color || "") === String(selectedColor || "") &&
        String(i.size || "") === String(selectedSize || ""),
    );
    setAddedToCart(Boolean(exists));
  }, [cartItems, product?.product_id, selectedColor, selectedSize]);

  return (
    <main className="max-w-6xl mx-auto md:p-2 grid gap-2 pb-24 md:pb-0 relative">
      {loading && (
        <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border border-black/20" />
              <div className="absolute inset-0 rounded-full border-2 border-black/10 border-t-black animate-spin" />
              <div className="absolute inset-4 rounded-full border border-black/20" />
            </div>
            <div className="text-sm font-semibold tracking-wide">Loading Product…</div>
          </div>
        </div>
      )}
      <div className="md:hidden">
        <nav className="text-[11px] pl-3 text-[var(--muted)] flex flex-wrap gap-1">
          {breadcrumbs.map((c: any, i: number) => (
            <span key={i} className="flex items-center gap-1">
              {c.href ? (
                <a href={c.href} className="underline-offset-2 hover:underline font-semibold text-black">
                  {c.label}
                </a>
              ) : (
                <span className="font-semibold text-black">{c.label}</span>
              )}
              {i < breadcrumbs.length - 1 && <span className="text-black">/</span>}
            </span>
          ))}
        </nav>
      </div>

      <div className="grid md:grid-cols-[1.2fr_1fr] gap-2 md:gap-8 items-start">
        <div ref={leftRef} className={`${stick === "left" ? "md:sticky md:top-4" : ""}`}>
          {product && (
            <Gallery
              title={product.name}
              images={displayImages}
              video={displayVideo}
              rating={avgRating || 0}
              reviews={reviewCount}
              highlights={product.key_highlights || []}
              selectedColor={selectedColor}
              selectedSize={selectedSize}
              wishlisted={wishlistIds.has(String(product.product_id))}
              onToggleWishlist={toggleWishlist}
              similarItems={similarProducts.map((p) => ({
                title: p.name,
                price: p.price,
                image: p.images?.[0] || "",
                badge: p.discount ? `${p.discount}% OFF` : undefined,
              }))}
            />
          )}
        </div>
        <div ref={rightRef} className={`${stick === "right" ? "md:sticky md:top-4" : ""}`}>
          {product && (
            <InfoPanel
              breadcrumbs={breadcrumbs as any}
              name={product.name}
              price={displayPrice}
              mrp={displayMrp}
              discount={
                product.discount ||
                (displayMrp && displayPrice && displayMrp > displayPrice
                  ? `${Math.round(((displayMrp - displayPrice) / displayMrp) * 100)}% OFF`
                  : "")
              }
              rating={avgRating || 0}
              reviews={reviewCount}
              colors={colorOptions}
              selectedColor={selectedColor}
              onSelectColor={setSelectedColor}
              sizes={displaySizes}
              selectedSize={selectedSize}
              onSelectSize={setSelectedSize}
              delivery={{ pincode: "", eta: "" }}
              highlights={product.key_highlights || []}
              description={product.description || ""}
              onAddToCart={addToCart}
              addedToCart={addedToCart}
              onGoToCart={() => (window.location.href = "/cart")}
              onBuyNow={async (payload) => {
                saveBuyNowItem(payload.color, payload.size);
                window.location.href = "/checkout";
              }}
            />
          )}
        </div>
      </div>

      {recentlyViewed.length > 0 && (
        <ProductRail
          title="Recently Viewed"
          items={recentlyViewed.map((p: any) => ({
            id: p.product_id || p._id,
            title: p.name,
            price: p.discountedPrice ?? p.selling_price ?? p.price,
            mrp: p.mrp ?? p.price,
            image: p.images?.[0] || "",
            images: p.images || [],
            badge: p.discount ? `${p.discount}% OFF` : undefined,
          }))}
        />
      )}

      {similarProducts.length > 0 && (
        <ProductRail
          title="Similar Products"
          items={combinedSimilar}
        />
      )}

      <Reviews
        title="Reviews"
        reviews={reviews.map((r: any) => ({
          user: r.user_name || r.userName || "User",
          rating: Number(r.review_rate ?? r.rating ?? 5),
          date: r.createdAt ? new Date(r.createdAt).toDateString() : "",
          text: r.review_text || r.text || r.review || "",
          images: r.review_image ? [r.review_image] : r.images || [],
        }))}
        onSubmit={async ({ rating, text, images }) => {
          if (!product?.product_id) {
            return { ok: false, message: "Missing product id." };
          }
          const fd = new FormData();
          fd.append("product_id", String(product.product_id));
          fd.append("review_rate", String(rating));
          fd.append("review_text", text);
          const email = getUserEmail();
          if (email) fd.append("user_email", email);
          if (images?.[0]) fd.append("reviewImage", images[0]);
          try {
            const res = await fetch(`${API_BASE}/product-reviews`, { method: "POST", body: fd });
            const data = await res.json();
            if (!res.ok) return { ok: false, message: data?.message || "Submit failed." };
            if (data?.review) setReviews((prev) => [data.review, ...prev]);
            return { ok: true };
          } catch (e: any) {
            return { ok: false, message: e?.message || "Submit failed." };
          }
        }}
      />
    </main>
  );
}


