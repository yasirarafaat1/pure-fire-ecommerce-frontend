import type { Metadata } from "next";
import { generateProductMetadata, formatMetaDescription, normalizeUrl } from "@/app/lib/metadata-utils";
import { buildProductPath } from "../utils/productUrl";

type ProductShape = {
    title?: string;
    name?: string;
    meta_description?: string;
    description?: string;
    price?: number;
    selling_price?: number;
    mrp?: number;
    images?: string[] | string;
    product_image?: string[] | string;
    image?: string;
    imageUrl?: string;
    catagory_id?: { name?: string } | string;
    colorVariants?: Array<{ images?: string[] | string }>;
};

const normalizeBase = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return trimmed;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(trimmed)) return `http://${trimmed}`;
    return `https://${trimmed}`;
};

const toArray = (value: string[] | string | undefined) => {
    if (!value) return [] as string[];
    if (Array.isArray(value)) return value;
    return value.split(/[\s,]+/).filter(Boolean);
};

const pickImage = (product: ProductShape) => {
    const variantImages = product.colorVariants?.[0]?.images;
    const list = [
        ...toArray(product.images),
        ...toArray(product.product_image),
        ...toArray(product.image),
        ...toArray(product.imageUrl),
        ...toArray(variantImages),
    ];
    return list.find(Boolean) || "";
};

const resolveImageUrl = (raw: string, base: string) => {
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith("//")) return `https:${raw}`;
    if (raw.startsWith("/")) return `${base.replace(/\/$/, "")}${raw}`;
    return raw;
};

const defaultMetadata: Metadata = {
    title: "Product",
    description: "Shop premium everyday wear at Pure Fire.",
};

export async function buildProductMetadataById(id: string, slug?: string): Promise<Metadata> {
    if (!id) return defaultMetadata;

    const siteUrl = normalizeBase(
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.VERCEL_PROJECT_PRODUCTION_URL ||
        process.env.VERCEL_URL ||
        "https://pure-fire.vercel.app",
    ).replace(/\/$/, "");
    const baseUrl = normalizeBase(process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || "").replace(
        /\/$/, "",
    );
    const productPath = buildProductPath({ id, slug: slug || "product" });
    const canonicalUrl = `${siteUrl}${productPath}`;

    try {
        const endpoints = [
            baseUrl ? `${baseUrl}/user/get-product-byid/${id}` : "",
            `${siteUrl}/api/user/get-product-byid/${id}`,
        ].filter(Boolean);

        let product: ProductShape | null = null;
        for (const endpoint of endpoints) {
            try {
                const res = await fetch(endpoint, {
                    next: { revalidate: 60 },
                });
                if (!res.ok) continue;
                const data = await res.json();
                const candidate = (data?.data?.[0] || data?.product || data?.data || null) as ProductShape | null;
                if (candidate && (candidate.title || candidate.name)) {
                    product = candidate;
                    break;
                }
            } catch {
                // Try next endpoint
            }
        }

        if (!product) {
            return generateProductMetadata({
                title: "Product",
                description: defaultMetadata.description || "Shop premium everyday wear at Pure Fire.",
                url: canonicalUrl,
                image: `${siteUrl}/og-image.png`,
                imageAlt: "Pure Fire",
                tags: ["clothing", "everyday wear", "quality apparel"],
            });
        }

        const title = (product.title || product.name || "Product").replace(/\s+/g, " ").trim();
        const rawDescription = product.meta_description || product.description || "";
        const description = formatMetaDescription(rawDescription) || defaultMetadata.description || "";
        const imageBase = baseUrl || siteUrl;
        const image = resolveImageUrl(pickImage(product), imageBase) || `${siteUrl}/og-image.png`;

        // Price information
        const price = product.selling_price || product.price || 0;
        const mrp = product.mrp || product.price || 0;

        // Category tag
        const categoryName = typeof product.catagory_id === "object"
            ? product.catagory_id?.name
            : "clothing";

        return generateProductMetadata({
            title,
            description,
            image,
            imageAlt: title,
            url: canonicalUrl,
            price,
            originalPrice: mrp,
            tags: [categoryName || "clothing", "everyday wear", "quality apparel"],
        });
    } catch (error) {
        console.error("Error fetching product metadata:", error);
        return defaultMetadata;
    }
}
