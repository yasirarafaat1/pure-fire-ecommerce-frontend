import type { MetadataRoute } from "next";

const resolveSiteUrl = () => {
  const envSite = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  if (envSite) return envSite;

  const vercelUrl = (process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || "").trim();
  if (vercelUrl) {
    return /^https?:\/\//i.test(vercelUrl) ? vercelUrl : `https://${vercelUrl}`;
  }

  // Final fallback keeps sitemap valid even when env vars are missing.
  return "https://pure-fire.vercel.app";
};

const baseUrl = resolveSiteUrl();
const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || "";

const normalizeBase = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(trimmed)) return `http://${trimmed}`;
  return `https://${trimmed}`;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = baseUrl.replace(/\/$/, "");
  const api = normalizeBase(apiBase).replace(/\/$/, "");
  type ProductSitemapItem = {
    product_id?: string;
    _id?: string;
    updatedAt?: string;
    createdAt?: string;
  };
  const entries: MetadataRoute.Sitemap = [
    {
      url: site || "",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  if (!site || !api) return entries;

  try {
    const res = await fetch(`${api}/user/show-product?limit=500`, {
      next: { revalidate: 300 },
    });
    const data = await res.json();
    const products = (data?.products || data?.data || []) as ProductSitemapItem[];
    products.forEach((p) => {
      const id = p?.product_id || p?._id;
      if (!id) return;
      entries.push({
        url: `${site}/product?id=${id}`,
        lastModified: new Date(p.updatedAt || p.createdAt || Date.now()),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    });
  } catch {
    // ignore sitemap fetch errors
  }

  return entries;
}
