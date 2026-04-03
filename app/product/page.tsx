import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ProductPageClient from "./ProductPageClient";
import { buildProductMetadataById } from "./metadata";
import { buildProductPath } from "../utils/productUrl";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { id?: string };
}): Promise<Metadata> {
  const id = searchParams?.id || "";
  return buildProductMetadataById(id);
}

export default function ProductPage({
  searchParams,
}: {
  searchParams: { id?: string; color?: string; size?: string };
}) {
  const id = searchParams?.id?.trim();
  if (id) {
    const params = new URLSearchParams();
    if (searchParams?.color) params.set("color", searchParams.color);
    if (searchParams?.size) params.set("size", searchParams.size);
    const query = params.toString();
    const path = buildProductPath({ id, slug: "product" });
    redirect(query ? `${path}?${query}` : path);
  }

  return <ProductPageClient />;
}
