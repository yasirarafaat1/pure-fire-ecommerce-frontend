import type { Metadata } from "next";
import ProductPageClient from "../../ProductPageClient";
import { buildProductMetadataById } from "../../metadata";

export const dynamic = "force-dynamic";

type ProductSlugParams = { id: string; slug: string };

export async function generateMetadata({
    params,
}: {
    params: ProductSlugParams | Promise<ProductSlugParams>;
}): Promise<Metadata> {
    const resolvedParams = await Promise.resolve(params);
    return buildProductMetadataById(resolvedParams?.id || "", resolvedParams?.slug || "");
}

export default function ProductSlugPage() {
    return <ProductPageClient />;
}
