export const dynamic = "force-dynamic";

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
export default function sitemap(): MetadataRoute.Sitemap {
  const site = baseUrl.replace(/\/$/, "");
  const now = new Date();
  const staticRoutes: Array<{ path: string; changeFrequency: "daily" | "weekly" | "monthly"; priority: number }> = [
    { path: "/", changeFrequency: "daily", priority: 1 },
    { path: "/collections", changeFrequency: "daily", priority: 0.9 },
    { path: "/collections/all", changeFrequency: "daily", priority: 0.9 },
    { path: "/shipping-info", changeFrequency: "monthly", priority: 0.6 },
    { path: "/return-policy", changeFrequency: "monthly", priority: 0.6 },
    { path: "/privacy-policy", changeFrequency: "monthly", priority: 0.6 },
    { path: "/terms-and-conditions", changeFrequency: "monthly", priority: 0.6 },
    { path: "/faqs", changeFrequency: "monthly", priority: 0.6 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
    { path: "/support", changeFrequency: "weekly", priority: 0.6 },
  ];

  return staticRoutes.map((route) => ({
    url: `${site}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
