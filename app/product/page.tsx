import type { Metadata } from "next";
import ProductPageClient from "./ProductPageClient";

export const dynamic = "force-dynamic";

const normalizeBase = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(trimmed)) return `http://${trimmed}`;
  return `https://${trimmed}`;
};

const stripHtml = (value: string) =>
  value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const pickImage = (product: any) => {
  const raw =
    product?.images ||
    product?.product_image ||
    product?.image ||
    product?.imageUrl ||
    product?.colorVariants?.[0]?.images ||
    [];
  const list = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? raw.split(/[\s,]+/).filter(Boolean)
      : [];
  return list.find(Boolean) || "";
};

const resolveImageUrl = (raw: string, base: string) => {
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  if (raw.startsWith("/")) return `${base.replace(/\/$/, "")}${raw}`;
  return raw;
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { id?: string };
}): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const baseUrl = normalizeBase(
    process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || "http://localhost:8080",
  );
  const id = searchParams?.id || "";

  if (!id) {
    return {
      title: "Product",
      description: "Shop premium everyday wear at Pure Fire.",
    };
  }

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/user/get-product-byid/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return {
        title: "Product",
        description: "Shop premium everyday wear at Pure Fire.",
      };
    }
    const data = await res.json();
    const product = data?.data?.[0] || data?.product || data?.data || {};
    const title = product?.title || product?.name || "Product";
    const descriptionSource = product?.meta_description || product?.description || "";
    const description = stripHtml(descriptionSource).slice(0, 160) || "Shop premium everyday wear at Pure Fire.";
    const image = resolveImageUrl(pickImage(product), baseUrl);
    const url = siteUrl ? `${siteUrl.replace(/\/$/, "")}/product?id=${id}` : undefined;

    return {
      title,
      description,
      alternates: url ? { canonical: url } : undefined,
      openGraph: {
        title,
        description,
        type: "website",
        url,
        images: image ? [{ url: image, alt: title }] : [],
      },
      twitter: {
        card: image ? "summary_large_image" : "summary",
        title,
        description,
        images: image ? [image] : [],
      },
    };
  } catch {
    return {
      title: "Product",
      description: "Shop premium everyday wear at Pure Fire.",
    };
  }
}

export default function ProductPage() {
  return <ProductPageClient />;
}
