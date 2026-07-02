"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

type ActionToast = {
  id: number;
  message: string;
  tone: "success" | "info" | "error";
};

export default function ProductPageClient() {
  const router = useRouter();
  const { productId, colorParam, sizeParam, nextUrl } = useProductQuery();
  const { leftRef, rightRef, stick } = useStickyColumns();
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [actionToast, setActionToast] = useState<ActionToast | null>(null);
  const toastTimerRef = useRef<number | null>(null);

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

  const showActionToast = useCallback(
    (message: string, tone: ActionToast["tone"] = "success") => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      setActionToast({ id: Date.now(), message, tone });
      toastTimerRef.current = window.setTimeout(() => {
        setActionToast(null);
        toastTimerRef.current = null;
      }, 2400);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

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

    try {
      const res = await fetch(`${API_BASE}/add-to-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data?.status === false) {
        showActionToast(data?.message || "Could not add to cart.", "error");
        return;
      }

      if (data?.cart_id) localStorage.setItem("cart_id", data.cart_id);
      if (data?.items) setCartItems(data.items);

      window.dispatchEvent(new Event("cart:updated"));
      showActionToast(`${product.name} added to cart.`, "success");
    } catch {
      showActionToast("Could not add to cart.", "error");
    }
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

    const email = getUserEmail();
    if (!email) {
      router.push(`/login?next=${encodeURIComponent(nextUrl || "/")}`);
      return;
    }

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
      showActionToast(
        isWishlisted ? "Removed from wishlist." : "Added to wishlist.",
        isWishlisted ? "info" : "success",
      );
    } catch {
      showActionToast("Wishlist update failed.", "error");
    }
  };

  return (
    <main className="product-page-root max-w-6xl mx-auto -mt-3 grid gap-2 md:mt-0 md:p-2 relative">
      {actionToast ? (
        <div
          key={actionToast.id}
          className={`product-action-toast product-action-toast-${actionToast.tone}`}
          role="status"
          aria-live="polite"
        >
          <span className="product-action-toast-dot" />
          <span className="min-w-0 truncate">{actionToast.message}</span>
        </div>
      ) : null}

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
                  wishlisted={wishlistIds.has(String(product.product_id))}
                  onToggleWishlist={toggleWishlist}
                  onGoToCart={() => {
                    showActionToast("Opening cart.", "info");
                    openCartModal();
                  }}
                  onBuyNow={async (payload) => {
                    saveBuyNowItem(payload.color, payload.size);
                    showActionToast("Opening secure checkout.", "info");
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

      <style jsx>{`
        .product-action-toast {
          position: fixed;
          left: 50%;
          top: max(92px, calc(env(safe-area-inset-top) + 76px));
          z-index: 95;
          display: inline-flex;
          max-width: min(92vw, 420px);
          transform: translateX(-50%);
          align-items: center;
          gap: 10px;
          border-radius: 999px;
          border: 1px solid rgba(15, 23, 42, 0.1);
          background: rgba(255, 255, 255, 0.96);
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
          box-shadow: 0 18px 48px rgba(15, 23, 42, 0.18);
          backdrop-filter: blur(10px);
          animation: productToastIn 240ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .product-action-toast-dot {
          width: 9px;
          height: 9px;
          flex: 0 0 auto;
          border-radius: 999px;
          background: #16a34a;
          box-shadow: 0 0 0 5px rgba(22, 163, 74, 0.12);
        }

        .product-action-toast-info .product-action-toast-dot {
          background: #020617;
          box-shadow: 0 0 0 5px rgba(2, 6, 23, 0.1);
        }

        .product-action-toast-error .product-action-toast-dot {
          background: #dc2626;
          box-shadow: 0 0 0 5px rgba(220, 38, 38, 0.12);
        }

        @keyframes productToastIn {
          from {
            transform: translateX(-50%) translateY(-10px) scale(0.96);
            opacity: 0;
          }

          to {
            transform: translateX(-50%) translateY(0) scale(1);
            opacity: 1;
          }
        }

        @media (max-width: 767px) {
          .product-page-root {
            padding-bottom: 96px;
          }

          .product-action-toast {
            top: max(76px, calc(env(safe-area-inset-top) + 64px));
            max-width: calc(100vw - 28px);
          }
        }

        @media (min-width: 768px) {
          .product-page-root {
            padding-bottom: 0 !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .product-action-toast {
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}
