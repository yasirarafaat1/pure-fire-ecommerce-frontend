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

export async function buildProductMetadataById(id: string): Promise<Metadata> {
    if (!id) return defaultMetadata;

    const siteUrl = normalizeBase(process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
    const baseUrl = normalizeBase(
        process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || "http://localhost:8080",
    ).replace(/\/$/, "");

    try {
        const res = await fetch(`${baseUrl}/user/get-product-byid/${id}`, {
            next: { revalidate: 60 },
        });

        if (!res.ok) return defaultMetadata;

        const data = await res.json();
        const product = (data?.data?.[0] || data?.product || data?.data || {}) as ProductShape;
        const title = product.title || product.name || "Product";
        const rawDescription = product.meta_description || product.description || "";
        const description = formatMetaDescription(rawDescription);
        const image = resolveImageUrl(pickImage(product), baseUrl);
        const path = buildProductPath({ id, name: title });
        const url = siteUrl ? `${siteUrl}${path}` : undefined;

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
            url,
            price,
            originalPrice: mrp,
            tags: [categoryName || "clothing", "everyday wear", "quality apparel"],
        });
    } catch (error) {
        console.error("Error fetching product metadata:", error);
        return defaultMetadata;
    }
}
