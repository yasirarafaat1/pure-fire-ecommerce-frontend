import namer from "color-namer";

type RawSize = string | { label?: string; size?: string; stock?: number | string };
type RawVariant = {
  color?: string;
  images?: string | string[];
  video?: string;
  price?: number;
  discountedPrice?: number;
  sizes?: RawSize[] | string;
};
type RawProduct = {
  _id?: string | number;
  product_id?: string | number;
  name?: string;
  title?: string;
  images?: string[];
  product_image?: string[];
  colorVariants?: RawVariant[];
  video?: string;
  video_url?: string;
  mrp?: number;
  price?: number;
  selling_price?: number;
  discountedPrice?: number;
  category?: string;
  category_name?: string;
  Catagory?: { name?: string; title?: string };
  colors?: string[];
  sizes?: RawSize[] | string;
  [key: string]: unknown;
};

const parseVariantImages = (images?: string | string[]) => {
  if (typeof images === "string") return images.split(" ").filter(Boolean);
  return Array.isArray(images) ? images.filter(Boolean) : [];
};

export const normalizeProduct = (raw: RawProduct | null | undefined) => {
  if (!raw) return null;
  const parseList = (val: RawSize[] | string | undefined) => {
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === "string") {
      return val
        .split(/[,\s]+/)
        .map((v) => v.trim())
        .filter(Boolean);
    }
    return [];
  };
  const variantImages = parseVariantImages(raw?.colorVariants?.[0]?.images);
  const variants = (raw.colorVariants || []).map((v) => {
    const vMrpRaw = v.price ?? raw.mrp ?? raw.price ?? 0;
    const vDiscountRaw =
      v.discountedPrice ?? raw.selling_price ?? raw.discountedPrice ?? v.price ?? raw.price ?? 0;
    const vSafeMrp = Math.max(vMrpRaw, vDiscountRaw);
    const vSafeDiscount = Math.min(vMrpRaw, vDiscountRaw);
    return {
      color: v.color,
      images: parseVariantImages(v.images),
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
    images: variantImages.length ? variantImages : raw.images || raw.product_image || [],
    video: raw?.colorVariants?.[0]?.video || raw.video || raw.video_url || "",
    variants,
    category: raw.category || raw.category_name || raw?.Catagory?.name || raw?.Catagory?.title || "",
    price: safeMrp,
    discountedPrice: safeDiscount,
    mrp: safeMrp,
  };
};

export const getColorNameFromHex = (input: string) => {
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
};
