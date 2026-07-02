import { adminApi } from "../../lib/adminApi";
import type { VariantForm } from "./variant-utils";
import { toSizePayload } from "./variant-utils";
import type { EditProduct, ProductFormState } from "./product-editor-types";

type SubmitInput = {
  product?: EditProduct | null;
  form: ProductFormState;
  categoryId: string;
  status: "draft" | "published";
  activeStep: number;
  description: string;
  highlights: Array<{ key: string; value: string }>;
  variants: VariantForm[];
};

const isPersistedMediaUrl = (url: string) => /^https?:\/\//i.test(url);

export async function submitProduct({
  product,
  form,
  categoryId,
  status,
  activeStep,
  description,
  highlights,
  variants,
}: SubmitInput) {
  const fd = new FormData();
  Object.entries(form).forEach(([key, value]) => {
    if (key !== "sku") fd.append(key, value || "");
  });
  const sku = form.sku.trim().toUpperCase();
  fd.append("sku", sku);
  fd.append("categoryId", categoryId);
  fd.append("status", status);
  fd.append(
    "draft_stage",
    status === "published" ? "complete" : ["category", "details", "variants"][activeStep - 1]
  );
  fd.append("description", description);
  fd.append("key_highlights", JSON.stringify(highlights.filter((item) => item.key && item.value)));

  const withPrimary = variants.some((variant) => variant.primary)
    ? variants
    : variants.map((variant, index) => ({ ...variant, primary: index === 0 }));
  const processed = withPrimary.map((variant) => {
    const imagePreviews = variant.imagePreviews || [];
    const existingImages = imagePreviews.filter(isPersistedMediaUrl);
    const existingVideo = variant.videoPreview && isPersistedMediaUrl(variant.videoPreview) ? variant.videoPreview : "";
    return {
      color: variant.color.trim(),
      price: Number(variant.price) || 0,
      discountedPrice: Number(variant.discountedPrice || variant.price) || 0,
      imageCount: variant.imagesFiles.length,
      hasVideo: Boolean(variant.videoFile || variant.videoPreview),
      images: existingImages,
      video: existingVideo,
      sizes: toSizePayload(variant.sizes),
      primary: Boolean(variant.primary),
    };
  });
  const primary = processed.find((variant) => variant.primary) || processed[0];
  const totalQuantity = processed.reduce(
    (total, variant) =>
      total +
      variant.sizes.reduce(
        (subtotal, size) => subtotal + (Number.isFinite(size.stock) ? size.stock : 0),
        0
      ),
    0
  );
  fd.set("price", String(primary.price));
  fd.set("selling_price", String(primary.discountedPrice || primary.price));
  fd.set("quantity", String(totalQuantity || Number(form.quantity) || 0));
  fd.append("colorVariants", JSON.stringify(processed));
  withPrimary.forEach((variant) => {
    variant.imagesFiles.forEach((file) => fd.append("variantImages", file));
    if (variant.videoFile) fd.append("variantVideos", variant.videoFile);
  });

  let path = "/products";
  let method: "POST" | "PATCH" = "POST";
  if (product?.draft_id) {
    path = `/products/drafts/${product.draft_id}`;
    method = "PATCH";
  } else if (!product && status === "draft") {
    path = "/products/drafts";
  } else if (product?.product_id) {
    path = `/products/${product.product_id}`;
    method = "PATCH";
  }
  await adminApi.request(path, { method, body: fd });
}
