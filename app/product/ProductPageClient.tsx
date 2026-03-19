"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Gallery from "./components/Gallery";
import InfoPanel from "./components/InfoPanel";
import ProductRail from "./components/ProductRail";
import Reviews from "./components/Reviews";
import { getUserEmail, getUserToken } from "../utils/auth";
import { useProductQuery } from "./hooks/useProductQuery";
import { useStickyColumns } from "./hooks/useStickyColumns";
import { useProductPageData } from "./hooks/useProductPageData";
import { useProductViewModel } from "./hooks/useProductViewModel";

const API_BASE = "/api/user";
const getToken = () => getUserToken();

export default function ProductPageClient() {
  const router = useRouter();
  const { productId, colorParam, sizeParam, nextUrl } = useProductQuery();
  const { leftRef, rightRef, stick } = useStickyColumns();
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const {
    product,
    similarProducts,
    reviews,
    recentlyViewed,
    cartItems,
    setCartItems,
    wishlistIds,
    setWishlistIds,
    loading,
    setReviews,
  } = useProductPageData({
    productId,
    colorParam,
    sizeParam,
    setSelectedColor,
    setSelectedSize,
  });

  const {
    breadcrumbs,
    displayImages,
    displayVideo,
    displaySizes,
    displayPrice,
    displayMrp,
    colorOptions,
    combinedSimilar,
    reviewCount,
    avgRating,
    addedToCart,
  } = useProductViewModel({
    product,
    similarProducts,
    reviews,
    selectedColor,
    selectedSize,
    setSelectedSize,
    cartItems,
  });

  const requireAuth = () => {
    const token = getToken();
    if (!token) {
      router.push(`/login?next=${encodeURIComponent(nextUrl || "/")}`);
      return false;
    }
    return true;
  };

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
    if (data?.items) setCartItems(data.items);
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
            <div className="text-sm font-semibold tracking-wide">Loading Product...</div>
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

      {similarProducts.length > 0 && <ProductRail title="Similar Products" items={combinedSimilar} />}

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
