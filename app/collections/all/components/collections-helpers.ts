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

export const isTshirt = (p: CardProduct) => hasCategory(p, ["t-shirt", "tshirt"]);

export const isShirt = (p: CardProduct) => hasCategory(p, ["shirt"]) && !isTshirt(p);

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
