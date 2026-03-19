import namer from "color-namer";

export const normalizeProduct = (raw: any) => {
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
