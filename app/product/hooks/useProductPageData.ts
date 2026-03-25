import { useEffect, useState } from "react";
import { normalizeProduct } from "../utils/productHelpers";
import { cachedFetch, getCachedJson } from "../../utils/cachedFetch";
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
      const cachedList = getCachedJson(`${API_BASE}/show-product`);
      const cachedListItems = Array.isArray(cachedList?.data?.products)
        ? cachedList?.data?.products
        : Array.isArray(cachedList?.data?.data)
          ? cachedList?.data?.data
          : [];
      const cachedFirst = cachedListItems?.[0];
      const cachedId = productId || cachedFirst?._id || cachedFirst?.product_id;
      const cachedDetail = cachedId ? getCachedJson(`${API_BASE}/get-product-byid/${cachedId}`) : null;
      const cachedDetailRaw =
        cachedDetail?.data?.data?.[0] || cachedDetail?.data?.product || cachedDetail?.data?.data;
      const initialProduct = cachedDetailRaw
        ? normalizeProduct(cachedDetailRaw)
        : cachedFirst
          ? normalizeProduct(cachedFirst)
          : null;
      if (cachedListItems.length) {
        setRecentlyViewed((cachedListItems || []).slice(0, 8).map(normalizeProduct));
      }
      if (initialProduct) {
        setProduct(initialProduct);
        setSelectedColor(colorParam || initialProduct?.variants?.[0]?.color || initialProduct?.colors?.[0] || null);
        if (sizeParam) setSelectedSize(sizeParam);
        setLoading(false);
      }
      const cachedReviews = cachedId ? getCachedJson(`${API_BASE}/get-product-reviews/${cachedId}`) : null;
      const initialReviews = Array.isArray(cachedReviews?.data?.reviews)
        ? cachedReviews?.data?.reviews
        : Array.isArray(cachedReviews?.data?.data)
          ? cachedReviews?.data?.data
          : [];
      if (initialReviews.length) setReviews(initialReviews);
      if (initialProduct?.category) {
        const cachedSimilar = getCachedJson(`${API_BASE}/get-product-byCategory/${initialProduct.category}`);
        const cachedSimilarList = Array.isArray(cachedSimilar?.data?.data)
          ? cachedSimilar?.data?.data
          : Array.isArray(cachedSimilar?.data?.products)
            ? cachedSimilar?.data?.products
            : [];
        const initialSimilar = cachedSimilarList
          .map(normalizeProduct)
          .filter((p: any) => p?._id !== cachedId && p?.product_id !== cachedId)
          .slice(0, 8);
        if (initialSimilar.length) setSimilarProducts(initialSimilar);
      }

      if (!initialProduct) setLoading(true);
      try {
        const listRes = await cachedFetch(`${API_BASE}/show-product`, undefined, 600000, true);
        const listData = await listRes.json();
        const list = listData?.products || listData?.data || [];
        const first = list?.[0];
        if (!first) return;
        const id = productId || first._id || first.product_id;

        const detailRes = await cachedFetch(`${API_BASE}/get-product-byid/${id}`, undefined, 600000, true);
        const detailData = await detailRes.json();
        const detail = detailData?.data?.[0] || detailData?.product || detailData?.data;
        const prod = normalizeProduct(detail || first);
        setProduct(prod);
        setSelectedColor(colorParam || prod?.variants?.[0]?.color || prod?.colors?.[0] || null);
        if (sizeParam) setSelectedSize(sizeParam);

        setRecentlyViewed((list || []).slice(0, 8).map(normalizeProduct));

        if (prod?.category) {
          const simRes = await cachedFetch(
            `${API_BASE}/get-product-byCategory/${prod.category}`,
            undefined,
            600000,
            true,
          );
          const simData = await simRes.json();
          const simList = simData?.data || simData?.products || [];
          setSimilarProducts(
            simList
              .map(normalizeProduct)
              .filter((p: any) => p?._id !== id && p?.product_id !== id)
              .slice(0, 8),
          );
        }

        const revRes = await cachedFetch(`${API_BASE}/get-product-reviews/${id}`, undefined, 600000, true);
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
