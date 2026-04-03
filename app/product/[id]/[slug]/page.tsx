import type { Metadata } from "next";
import ProductPageClient from "../../ProductPageClient";
import { buildProductMetadataById } from "../../metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({
    params,
}: {
    params: { id: string; slug: string };
}): Promise<Metadata> {
    return buildProductMetadataById(params?.id || "");
}

export default function ProductSlugPage() {
    return <ProductPageClient />;
}
