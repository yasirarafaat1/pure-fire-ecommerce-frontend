import { CardProduct } from "./collections-types";

export const toNum = (val: any) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
};

export const dedupe = <T,>(items: T[]) => Array.from(new Set(items));

export const getFabricValue = (item: any) => {
  const all = [...(item?.key_highlights || []), ...(item?.specifications || [])];
  const hit = all.find((h: any) => String(h?.key || "").toLowerCase().includes("fabric"));
  return hit?.value ? String(hit.value) : "";
};

export const buildSearchText = (item: any, categoryName: string, categoryPath: string[]) => {
  const rawHighlights = [...(item?.key_highlights || []), ...(item?.specifications || [])];
  const highlightText = rawHighlights
    .map((h: any) => [h?.key, h?.value].filter(Boolean).join(" "))
    .join(" ");
  const parts = [
    item?.title,
    item?.name,
    item?.description,
    item?.short_description,
    item?.shortDescription,
    item?.details,
    item?.about,
    item?.tagline,
    item?.seo_description,
    item?.material,
    item?.fabric,
    item?.fabric_type,
    item?.fabricType,
    item?.season,
    item?.occasion,
    item?.style,
    item?.fit,
    item?.pattern,
    item?.sleeve,
    item?.sleeve_type,
    item?.sleeveType,
    item?.neck,
    item?.neck_type,
    item?.neckType,
    item?.subcategory,
    item?.sub_category,
    item?.child_category,
    categoryName,
    ...(categoryPath || []),
    highlightText,
  ]
    .filter(Boolean)
    .join(" ");
  return String(parts).toLowerCase();
};

export const buildContentText = (item: any) => {
  const rawHighlights = [...(item?.key_highlights || []), ...(item?.specifications || [])];
  const highlightText = rawHighlights
    .map((h: any) => [h?.key, h?.value].filter(Boolean).join(" "))
    .join(" ");
  const parts = [
    item?.title,
    item?.name,
    item?.description,
    item?.short_description,
    item?.shortDescription,
    highlightText,
  ]
    .filter(Boolean)
    .join(" ");
  return String(parts).toLowerCase();
};

export const resolveCreatedAt = (item: any) => {
  const raw = item?.createdAt || item?.created_at || item?.updatedAt || item?.updated_at || item?.created || item?.date;
  const ts = raw ? new Date(raw).getTime() : 0;
  if (Number.isFinite(ts) && ts > 0) return ts;
  const idNum = Number(item?.product_id || item?._id || 0);
  return Number.isFinite(idNum) ? idNum : undefined;
};

export const normalizeName = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();

export const buildVariants = (value: string) => {
  const key = normalizeName(value);
  if (!key) return [];
  const singular = key.endsWith("s") ? key.slice(0, -1) : key;
  return dedupe([key, singular].filter(Boolean));
};

export const getPathText = (p: CardProduct) =>
  [p.category, ...(p.categoryPath || [])].filter(Boolean).join(" ").toLowerCase();

export const hasCategory = (p: CardProduct, keys: string[]) =>
  keys.some((k) => getPathText(p).includes(k));

export const isTshirt = (p: CardProduct) => {
  const text = p.contentText || p.searchText || p.title || "";
  return ["t-shirt", "tshirt", "t shirt"].some((k) => text.toLowerCase().includes(k));
};

export const isShirt = (p: CardProduct) => {
  const text =
    p.searchText ||
    [p.title, p.category, ...(p.categoryPath || [])].filter(Boolean).join(" ").toLowerCase();
  const hasShirt = text.toLowerCase().includes("shirt");
  const isTee = ["t-shirt", "tshirt", "t shirt", "tee"].some((k) => text.toLowerCase().includes(k));
  return hasShirt && !isTee;
};

export const isCotton = (p: CardProduct) => (p.fabric || "").toLowerCase().includes("cotton");

export const isHalfSleeve = (p: CardProduct) => {
  const t = p.title.toLowerCase();
  return (
    t.includes("half sleeve") ||
    t.includes("half sleeves") ||
    t.includes("half-sleeve") ||
    t.includes("half-sleeves")
  );
};

export const isJeansProduct = (p: CardProduct) => {
  const text =
    p.searchText ||
    [p.title, p.category, ...(p.categoryPath || [])].filter(Boolean).join(" ").toLowerCase();
  const lowered = text.toLowerCase();
  const keywords = ["jean", "jeans", "denim"];
  const hits = keywords.reduce((count, k) => {
    const matches = lowered.match(new RegExp(k, "g"));
    return count + (matches ? matches.length : 0);
  }, 0);
  return hits >= 2;
};

export const isKurtaProduct = (p: CardProduct) => {
  const text = p.contentText || p.searchText || p.title || "";
  return ["kurta", "kurtas"].some((k) => text.toLowerCase().includes(k));
};

export const isSummerProduct = (p: CardProduct) => {
  const text =
    p.searchText ||
    [p.title, p.category, ...(p.categoryPath || [])].filter(Boolean).join(" ").toLowerCase();
  const base = text.toLowerCase();
  const fabricText = `${p.fabric || ""} ${base}`;
  const hasAny = (vals: string[]) => vals.some((v) => base.includes(v));
  const hasFabric = (vals: string[]) => vals.some((v) => fabricText.includes(v));
  const isTee = hasAny(["t-shirt", "tshirt", "t shirt", "tee"]);
  const isSleeve = hasAny(["half sleeve", "half-sleeve", "short sleeve", "short-sleeve"]);
  const summerFabric = hasFabric([
    "cotton",
    "organic cotton",
    "linen",
    "rayon",
    "viscose",
    "modal",
    "chambray",
    "seersucker",
    "poplin",
    "voile",
    "chiffon",
    "georgette",
    "crepe",
    "muslin",
    "khadi",
  ]);
  const summerText = hasAny([
    "summer",
    "summer wear",
    "for summer",
    "hot weather",
    "lightweight",
    "breathable",
  ]);
  return (isTee && isSleeve && summerFabric) || (summerFabric && (isTee || isSleeve || summerText)) || summerText;
};
