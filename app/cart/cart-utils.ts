import namer from "color-namer";
import type { CartItem, ProductSummary, RawCartItem } from "./cart-types";

export const mapCartItems = (
  rows: RawCartItem[] = [],
  productMap: Record<string, ProductSummary>,
): CartItem[] =>
  rows.map((item) => {
    const product = productMap[String(item.product_id)] || {};
    return {
      id: item.product_id,
      title: item.title || product.name || "Product",
      subcategory: product.title || "",
      price: Number(item.price || 0),
      mrp: item.mrp,
      qty: Number(item.qty || 1),
      image: item.image || product.product_image?.[0] || product.images?.[0] || "",
      color: item.color,
      size: item.size,
    };
  });

export const mapProductRailItems = (products: ProductSummary[]) =>
  products.slice(0, 8).map((product) => ({
    id: product.product_id || product._id,
    title: product.name || product.title || "Product",
    price: product.discountedPrice ?? product.selling_price ?? product.price ?? 0,
    mrp: product.mrp ?? product.price,
    image: product.images?.[0] || product.product_image?.[0] || "",
    images: product.images || product.product_image || [],
  }));

export const getColorName = (input = "") => {
  const raw = input.trim();
  if (!raw) return "";
  const hex = raw.startsWith("#")
    ? raw
    : /^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(raw)
      ? `#${raw}`
      : "";
  if (!hex) return raw.replace(/\b\w/g, (char) => char.toUpperCase());
  try {
    const result = namer(hex);
    return result?.basic?.[0]?.name || result?.html?.[0]?.name || "Custom";
  } catch {
    return "Custom";
  }
};
