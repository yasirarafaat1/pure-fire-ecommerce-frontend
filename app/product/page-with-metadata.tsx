/**
 * Product Page with Dynamic SEO Metadata
 * Demonstrates complete metadata generation for product pages
 * Supports both legacy query-based route (/product?id=X) and new slug route (/product/[id]/[slug])
 */

import type { Metadata } from "next";
import ProductPageClient from "./ProductPageClient";
import { generateProductMetadata, formatMetaDescription, normalizeUrl } from "@/app/lib/metadata-utils";
import { buildProductPath } from "@/app/utils/productUrl";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || "http://localhost:8080";

interface ProductPageProps {
    searchParams?: {
        id?: string;
        color?: string;
        size?: string;
    };
}

/**
 * Fetch product data for metadata generation
 */
async function fetchProductData(productId: string) {
    if (!productId) return null;

    try {
        const response = await fetch(
            `${API_BASE.replace(/\/$/, "")}/user/get-product-byid/${productId}`,
            { next: { revalidate: 60 } }
        );

        if (!response.ok) return null;

        const data = await response.json();
        return data?.data?.[0] || data?.product || data?.data || null;
    } catch (error) {
        console.error("Error fetching product:", error);
        return null;
    }
}

/**
 * Generate dynamic metadata for product page
 */
export async function generateMetadata({
    searchParams,
}: ProductPageProps): Promise<Metadata> {
    const productId = searchParams?.id || "";

    if (!productId) {
        return {
            title: "Product",
            description: "Shop premium everyday wear at Pure Fire.",
        };
    }

    const product = await fetchProductData(productId);

    if (!product) {
        return {
            title: "Product",
            description: "Shop premium everyday wear at Pure Fire.",
        };
    }

    const title = product?.title || product?.name || "Product";
    const rawDescription = product?.meta_description || product?.description || "";
    const description = formatMetaDescription(rawDescription);

    // Get main product image
    const images = Array.isArray(product?.images)
        ? product.images
        : Array.isArray(product?.product_image)
            ? product.product_image
            : [];
    const mainImage = images?.[0] || "";

    // Construct absolute image URL
    const imageUrl = mainImage
        ? mainImage.startsWith("http")
            ? mainImage
            : `${API_BASE.replace(/\/$/, "")}${mainImage.startsWith("/") ? mainImage : `/${mainImage}`}`
        : undefined;

    // Construct canonical URL
    const productPath = buildProductPath({
        id: productId,
        name: title,
    });
    const canonicalUrl = normalizeUrl(productPath);

    // Get price information
    const price = product?.price || product?.selling_price || 0;
    const mrp = product?.mrp || product?.price || 0;
    const discount =
        mrp && price ? Math.round(((mrp - price) / mrp) * 100) : 0;

    return generateProductMetadata({
        title,
        description,
        image: imageUrl,
        imageAlt: title,
        url: canonicalUrl,
        price,
        originalPrice: mrp,
        tags: [
            product?.catagory_id?.name || "clothing",
            "everyday wear",
            "quality apparel",
        ],
    });
}

/**
 * Render product page
 * Redirects legacy query URLs to clean slug routes
 */
export default function ProductPage({ searchParams }: ProductPageProps) {
    const id = searchParams?.id?.trim();

    // Redirect from legacy query URL to new slug route
    if (id) {
        const params = new URLSearchParams();
        if (searchParams?.color) params.set("color", searchParams.color);
        if (searchParams?.size) params.set("size", searchParams.size);

        const path = buildProductPath({ id, slug: "product" });
        const query = params.toString();
        redirect(query ? `${path}?${query}` : path);
    }

    return <ProductPageClient />;
}
