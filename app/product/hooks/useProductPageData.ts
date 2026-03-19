import { useEffect, useState } from "react";
import { normalizeProduct } from "../utils/productHelpers";
import { cachedFetch } from "../../utils/cachedFetch";
import { getUserToken } from "../../utils/auth";

const API_BASE = "/api/user";
const getToken = () => getUserToken();

type UseProductDataParams = {
  productId?: string;
  colorParam: string | null;
  sizeParam: string | null;
  setSelectedColor: (value: string | null) => void;
  setSelectedSize: (value: string | null) => void;
};

export const useProductPageData = ({
  productId,
  colorParam,
  sizeParam,
  setSelectedColor,
  setSelectedSize,
}: UseProductDataParams) => {
  const [product, setProduct] = useState<any | null>(null);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const listRes = await cachedFetch(`${API_BASE}/show-product`);
        const listData = await listRes.json();
        const list = listData?.products || listData?.data || [];
        const first = list?.[0];
        if (!first) return;
        const id = productId || first._id || first.product_id;

        const detailRes = await cachedFetch(`${API_BASE}/get-product-byid/${id}`);
        const detailData = await detailRes.json();
        const detail = detailData?.data?.[0] || detailData?.product || detailData?.data;
        const prod = normalizeProduct(detail || first);
        setProduct(prod);
        setSelectedColor(colorParam || prod?.variants?.[0]?.color || prod?.colors?.[0] || null);
        if (sizeParam) setSelectedSize(sizeParam);

        setRecentlyViewed((list || []).slice(0, 8).map(normalizeProduct));

        if (prod?.category) {
          const simRes = await cachedFetch(`${API_BASE}/get-product-byCategory/${prod.category}`);
          const simData = await simRes.json();
          const simList = simData?.data || simData?.products || [];
          setSimilarProducts(
            simList
              .map(normalizeProduct)
              .filter((p: any) => p?._id !== id && p?.product_id !== id)
              .slice(0, 8),
          );
        }

        const revRes = await cachedFetch(`${API_BASE}/get-product-reviews/${id}`);
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
  }, [productId, colorParam, sizeParam, setSelectedColor, setSelectedSize]);

  useEffect(() => {
    if (!product?.product_id) return;
    const token = getToken();
    if (!token) return;
    fetch(`${API_BASE}/activity/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-token": token },
      body: JSON.stringify({ product_id: product.product_id }),
    }).catch(() => {});
  }, [product?.product_id]);

  return {
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
  };
};
