import type { ProductFormState } from "./product-editor-types";
import type { VariantForm } from "./variant-utils";
import { toSizePayload } from "./variant-utils";

export const validateProductDetails = (
  form: ProductFormState,
  description: string,
  highlights: Array<{ key: string; value: string }>,
  minHighlights: number,
  maxHighlights: number
) => {
  if (!form.name.trim()) return "Product name required.";
  if (!description.replace(/<[^>]+>/g, "").trim()) return "Description required.";
  const complete = highlights.filter((item) => item.key.trim() && item.value.trim());
  if (complete.length < minHighlights || complete.length > maxHighlights) {
    return `Enter ${minHighlights}-${maxHighlights} key highlights.`;
  }
  return "";
};

export const validateProductVariants = (variants: VariantForm[]) => {
  if (!variants.length) return "Add at least one color.";
  for (const variant of variants) {
    if (!variant.color.trim()) return "Color name required.";
    const price = Number(variant.price);
    const discountedPrice = Number(variant.discountedPrice || variant.price);
    if (!Number.isFinite(price) || price <= 0) return "Price must be a positive number.";
    if (!Number.isFinite(discountedPrice) || discountedPrice <= 0) {
      return "Discounted price must be a positive number.";
    }
    if (discountedPrice >= price) return "Price must be greater than discounted price.";
    if (variant.imagesFiles.length + (variant.imagePreviews || []).length < 5) {
      return `Color ${variant.color || "color"}: need 5-10 images.`;
    }
    if (!variant.videoFile && !variant.videoPreview) {
      return `Color ${variant.color || "color"}: video required.`;
    }
    const sizes = toSizePayload(variant.sizes);
    if (!sizes.length) return `Color ${variant.color || "color"}: add sizes with stock.`;
    if (sizes.some((size) => !/^[A-Z]+$/.test(size.label))) {
      return "Sizes must be uppercase letters only (e.g., S, M, L, XL).";
    }
    if (sizes.some((size) => Number.isNaN(size.stock) || size.stock < 0)) {
      return "Stock must be a non-negative number.";
    }
  }
  return "";
};
