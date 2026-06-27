"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Gallery from "./components/Gallery";
import InfoPanel from "./components/InfoPanel";
import ProductRail from "./components/ProductRail";
import ProductPageLoader from "./components/ProductPageLoader";
import Reviews from "./components/Reviews";
import { getUserEmail, getUserToken } from "../utils/auth";
import { useProductQuery } from "./hooks/useProductQuery";
import { useStickyColumns } from "./hooks/useStickyColumns";
import { useProductPageData } from "./hooks/useProductPageData";
import { useProductViewModel } from "./hooks/useProductViewModel";
import { openCartModal } from "../cart/cart-events";
import SuggestedProducts from "../components/SuggestedProducts";

const API_BASE = "/api/user";
const getToken = () => getUserToken();

type ProductCard = {
  product_id?: string | number;
  _id?: string | number;
  name?: string;
  title?: string;
  price?: number;
  discountedPrice?: number;
  selling_price?: number;
  mrp?: number;
  images?: string[];
  product_image?: string[];
  discount?: string | number;
};

type ProductCrumb = { href?: string; label: string };

type WishlistApiProduct = {
  product_id?: string | number;
  _id?: string | number;
};

type ReviewApi = {
  user_name?: string;
  userName?: string;
  review_rate?: number | string;
  rating?: number | string;
  createdAt?: string;
  review_text?: string;
  text?: string;
  review?: string;
  review_image?: string;
  images?: string[];
};

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

  const suggestedItems = useMemo(() => {
    const currentProductId = String(product?.product_id || productId || "");

    const normalize = (item: ProductCard, index: number) => {
      const id = item.product_id || item._id || "";

      return {
        product_id: Number(id) || index + 1,
        name: item.name || item.title || "Product",
        title: item.title || item.name || "Product",
        product_image: item.product_image || item.images || [],
        selling_price:
          item.selling_price ?? item.discountedPrice ?? item.price ?? 0,
        price: item.mrp ?? item.price ?? item.selling_price ?? 0,
      };
    };

    const source = [
      ...((similarProducts || []) as ProductCard[]),
      ...((recentlyViewed || []) as ProductCard[]),
    ];

    const unique = new Map<string, ReturnType<typeof normalize>>();

    source.forEach((item, index) => {
      const rawId = String(item.product_id || item._id || "");

      if (!rawId) return;
      if (rawId === currentProductId) return;
      if (unique.has(rawId)) return;

      unique.set(rawId, normalize(item, index));
    });

    return Array.from(unique.values()).slice(0, 8);
  }, [similarProducts, recentlyViewed, product?.product_id, productId]);

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

    const email = (
      localStorage.getItem("user_email") || "guest@purefire.local"
    ).trim();

    localStorage.setItem("user_email", email);

    const isWishlisted = wishlistIds.has(String(product.product_id));
    const endpoint = isWishlisted ? "/wishlist/remove" : "/wishlist/add";

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-token": getToken() || "",
        },
        body: JSON.stringify({ email, product_id: product.product_id }),
      });

      const data = await res.json();

      const ids = new Set<string>(
        ((data?.products || []) as WishlistApiProduct[]).map((p) =>
          String(p.product_id || p._id || ""),
        ),
      );

      setWishlistIds(ids);
      window.dispatchEvent(new Event("wishlist:updated"));
    } catch {
      // ignore
    }
  };

  return (
    <main className="max-w-6xl mx-auto md:p-2 grid gap-2 md:pb-0 relative">
      {loading ? (
        <ProductPageLoader />
      ) : (
        <>
          <div className="md:hidden">
            <nav className="text-[11px] pl-3 text-[var(--muted)] flex flex-wrap gap-1">
              {(breadcrumbs as ProductCrumb[]).map((c, i) => (
                <span key={i} className="flex items-center gap-1">
                  {c.href ? (
                    <a
                      href={c.href}
                      className="underline-offset-2 hover:underline font-semibold text-black"
                    >
                      {c.label}
                    </a>
                  ) : (
                    <span className="font-semibold text-black">{c.label}</span>
                  )}

                  {i < breadcrumbs.length - 1 && (
                    <span className="text-black">/</span>
                  )}
                </span>
              ))}
            </nav>
          </div>

          <div className="grid md:grid-cols-[1.2fr_1fr] gap-2 md:gap-8 items-start">
            <div
              ref={leftRef}
              className={`${stick === "left" ? "md:sticky md:top-4" : ""}`}
            >
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

            <div
              ref={rightRef}
              className={`${stick === "right" ? "md:sticky md:top-4" : ""}`}
            >
              {product && (
                <InfoPanel
                  breadcrumbs={breadcrumbs as ProductCrumb[]}
                  name={product.name}
                  price={displayPrice}
                  mrp={displayMrp}
                  discount={
                    product.discount ||
                    (displayMrp && displayPrice && displayMrp > displayPrice
                      ? `${Math.round(
                          ((displayMrp - displayPrice) / displayMrp) * 100,
                        )}% OFF`
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
                  onGoToCart={openCartModal}
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
              items={(recentlyViewed as ProductCard[]).map((p) => ({
                id: p.product_id || p._id,
                title: p.name || "Product",
                price: p.discountedPrice ?? p.selling_price ?? p.price ?? 0,
                mrp: p.mrp ?? p.price,
                image: p.images?.[0] || "",
                images: p.images || [],
                badge: p.discount ? `${p.discount}% OFF` : undefined,
              }))}
            />
          )}

          {similarProducts.length > 0 && (
            <ProductRail title="Similar Products" items={combinedSimilar} />
          )}

          <Reviews
            title="Reviews"
            reviews={(reviews as ReviewApi[]).map((r) => ({
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
                const res = await fetch(`${API_BASE}/product-reviews`, {
                  method: "POST",
                  body: fd,
                });

                const data = await res.json();

                if (!res.ok) {
                  return {
                    ok: false,
                    message: data?.message || "Submit failed.",
                  };
                }

                if (data?.review) setReviews((prev) => [data.review, ...prev]);

                return { ok: true };
              } catch (error) {
                return {
                  ok: false,
                  message:
                    error instanceof Error ? error.message : "Submit failed.",
                };
              }
            }}
          />

          <SuggestedProducts items={suggestedItems} />
        </>
      )}
    </main>
  );
}