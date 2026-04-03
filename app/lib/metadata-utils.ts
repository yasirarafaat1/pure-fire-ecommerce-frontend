/**
 * Utilities for generating dynamic SEO metadata
 * Used for product pages, collections, and dynamic routes
 */

import type { Metadata } from "next";
import { siteConfig } from "@/app/config/metadata";

type MetadataInput = {
    title: string;
    description: string;
    image?: string;
    imageAlt?: string;
    imageWidth?: number;
    imageHeight?: number;
    url?: string;
    type?: "website" | "article";
    publishedTime?: Date;
    authors?: string[];
    tags?: string[];
};

/**
 * Build Open Graph metadata object
 */
export function buildOpenGraphMetadata(input: MetadataInput) {
    const {
        title,
        description,
        image = siteConfig.ogImage,
        imageAlt = title,
        imageWidth = 1200,
        imageHeight = 630,
        url = siteConfig.url,
        type = "website",
        publishedTime,
    } = input;

    const imageUrl = image.startsWith("http") ? image : `${siteConfig.url}${image}`;

    const ogData: any = {
        title,
        description,
        type,
        url,
        siteName: siteConfig.name,
        images: [
            {
                url: imageUrl,
                width: imageWidth,
                height: imageHeight,
                alt: imageAlt,
                type: image.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg",
            },
        ],
        locale: "en_US",
    };

    if (publishedTime && type === "article") {
        ogData.publishedTime = publishedTime.toISOString();
        ogData.modifiedTime = publishedTime.toISOString();
    }

    return ogData;
}

/**
 * Build Twitter Card metadata object
 */
export function buildTwitterMetadata(input: MetadataInput) {
    const {
        title,
        description,
        image = siteConfig.ogImage,
        imageAlt = title,
    } = input;

    const imageUrl = image.startsWith("http") ? image : `${siteConfig.url}${image}`;

    return {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
        imageAlt,
        creator: siteConfig.twitterHandle ? `@${siteConfig.twitterHandle}` : undefined,
    };
}

/**
 * Build complete metadata for a page
 */
export function generatePageMetadata(input: MetadataInput): Metadata {
    const {
        title,
        description,
        url = siteConfig.url,
        tags = [],
        authors = [],
    } = input;

    const ogMetadata = buildOpenGraphMetadata(input);
    const twitterMetadata = buildTwitterMetadata(input);

    const metadata: Metadata = {
        title,
        description,
        keywords: [...siteConfig.keywords, ...tags],
        authors: authors.length > 0 ? authors.map((a) => ({ name: a })) : undefined,
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
            },
        },
        alternates: {
            canonical: url,
        },
        openGraph: ogMetadata,
        twitter: twitterMetadata,
    };

    return metadata;
}

/**
 * Build product-specific metadata
 */
export function generateProductMetadata(input: MetadataInput & { price?: number; originalPrice?: number }): Metadata {
    const ogMetadata = buildOpenGraphMetadata({
        ...input,
        // Next.js metadata API does not support OpenGraph type "product".
        type: "website",
    });

    const twitterMetadata = buildTwitterMetadata(input);

    const productMeta: Metadata = {
        title: input.title,
        description: input.description,
        keywords: [...siteConfig.keywords, ...(input.tags || [])],
        authors: (input.authors || []).length > 0 ? (input.authors || []).map((a) => ({ name: a })) : undefined,
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
            },
        },
        alternates: {
            canonical: input.url,
        },
        openGraph: ogMetadata as any,
        twitter: twitterMetadata,
    };

    return productMeta;
}

/**
 * Format description for metadata (max 160 chars for SEO)
 */
export function formatMetaDescription(text: string, maxLength = 160): string {
    if (!text) return "";
    const cleaned = text
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    return cleaned.length > maxLength ? `${cleaned.substring(0, maxLength)}…` : cleaned;
}

/**
 * Normalize URL with proper trailing slash handling
 */
export function normalizeUrl(path: string): string {
    const base = siteConfig.url.replace(/\/$/, "");
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${base}${cleanPath}`;
}
