import { useEffect, useMemo } from "react";
import { getColorNameFromHex } from "../utils/productHelpers";

type UseProductViewModelParams = {
  product: any;
  similarProducts: any[];
  reviews: any[];
  selectedColor: string | null;
  selectedSize: string | null;
  setSelectedSize: (value: string | null) => void;
  cartItems: any[];
};

export const useProductViewModel = ({
  product,
  similarProducts,
  reviews,
  selectedColor,
  selectedSize,
  setSelectedSize,
  cartItems,
}: UseProductViewModelParams) => {
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
  }, [currentVariant, product]);

  const displaySizesKey = useMemo(() => displaySizes.join("|"), [displaySizes]);
  useEffect(() => {
    if (!displaySizes.length) {
      if (selectedSize !== null) setSelectedSize(null);
      return;
    }
    if (!selectedSize || !displaySizes.includes(selectedSize)) {
      setSelectedSize(displaySizes[0]);
    }
  }, [displaySizes, displaySizesKey, selectedColor, selectedSize, setSelectedSize]);

  const displayPrice = currentVariant?.discountedPrice ?? product?.discountedPrice ?? product?.price ?? 0;
  const displayMrp = currentVariant?.mrp ?? product?.mrp ?? product?.price ?? 0;

  const colorOptions =
    product?.variants?.length > 0
      ? product.variants.map((v: any) => ({ name: getColorNameFromHex(v.color), swatch: v.color }))
      : (product?.colors || []).map((c: any) => ({ name: getColorNameFromHex(c), swatch: c }));

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
      const sameProduct = String(card.id) === String(product?.product_id || product?._id);
      return !(sameProduct && card.color && card.color === selectedColor);
    })
    .filter((card: any, _i: number, arr: any[]) => {
      const hasVariantForId = arr.some((c) => String(c.id) === String(card.id) && c.color);
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

  const addedToCart = cartItems.some(
    (i: any) =>
      String(i.product_id) === String(product?.product_id) &&
      String(i.color || "") === String(selectedColor || "") &&
      String(i.size || "") === String(selectedSize || ""),
  );

  return {
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
  };
};
