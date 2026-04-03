import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const resolveSiteUrl = () => {
    const envSite = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
    if (envSite) return envSite;

    const vercelUrl = (process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || "").trim();
    if (vercelUrl) {
        return /^https?:\/\//i.test(vercelUrl) ? vercelUrl : `https://${vercelUrl}`;
    }

    return "https://pure-fire.vercel.app";
};

const staticRoutes: Array<{ path: string; changeFreq: "daily" | "weekly" | "monthly"; priority: number }> = [
    { path: "/", changeFreq: "daily", priority: 1 },
    { path: "/collections", changeFreq: "daily", priority: 0.9 },
    { path: "/collections/all", changeFreq: "daily", priority: 0.9 },
    { path: "/shipping-info", changeFreq: "monthly", priority: 0.6 },
    { path: "/return-policy", changeFreq: "monthly", priority: 0.6 },
    { path: "/privacy-policy", changeFreq: "monthly", priority: 0.6 },
    { path: "/terms-and-conditions", changeFreq: "monthly", priority: 0.6 },
    { path: "/faqs", changeFreq: "monthly", priority: 0.6 },
    { path: "/contact", changeFreq: "monthly", priority: 0.6 },
    { path: "/support", changeFreq: "weekly", priority: 0.6 },
];

const escapeXml = (value: string) =>
    value
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

export async function GET() {
    const site = resolveSiteUrl().replace(/\/$/, "");
    const now = new Date().toISOString();

    const urls = staticRoutes
        .map(
            (route) => `  <url>\n    <loc>${escapeXml(`${site}${route.path}`)}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${route.changeFreq}</changefreq>\n    <priority>${route.priority}</priority>\n  </url>`,
        )
        .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

    return new NextResponse(xml, {
        headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=0, must-revalidate",
        },
    });
}
