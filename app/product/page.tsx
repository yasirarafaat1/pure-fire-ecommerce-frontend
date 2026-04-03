import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ProductPageClient from "./ProductPageClient";
import { buildProductMetadataById } from "./metadata";
import { buildProductPath } from "../utils/productUrl";

export const dynamic = "force-dynamic";

type ProductSearchParams = { id?: string; color?: string; size?: string };

export async function generateMetadata({
  searchParams,
}: {
  searchParams: ProductSearchParams | Promise<ProductSearchParams>;
}): Promise<Metadata> {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const id = resolvedSearchParams?.id || "";
  return buildProductMetadataById(id);
}

export default async function ProductPage({
  searchParams,
}: {
  searchParams: ProductSearchParams | Promise<ProductSearchParams>;
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const id = resolvedSearchParams?.id?.trim();
  if (id) {
    const params = new URLSearchParams();
    if (resolvedSearchParams?.color) params.set("color", resolvedSearchParams.color);
    if (resolvedSearchParams?.size) params.set("size", resolvedSearchParams.size);
    const query = params.toString();
    const path = buildProductPath({ id, slug: "product" });
    redirect(query ? `${path}?${query}` : path);
  }

  return <ProductPageClient />;
}
