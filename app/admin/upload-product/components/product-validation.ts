import type { ProductFormState } from "./product-editor-types";
import type { VariantForm } from "./variant-utils";
import { toSizePayload } from "./variant-utils";

export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const PRODUCT_VIDEO_MAX_BYTES = 25 * 1024 * 1024;
export const PRODUCT_UPLOAD_MAX_BYTES = 80 * 1024 * 1024;
export const PRODUCT_UPLOAD_MAX_FILES = 40;

export const formatBytes = (bytes: number) => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${bytes}B`;
};

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
    const imageCount = variant.imagesFiles.length + (variant.imagePreviews || []).length;
    if (imageCount < 5) {
      return `Color ${variant.color || "color"}: need 5-10 images.`;
    }
    if (imageCount > 10) {
      return `Color ${variant.color || "color"}: maximum 10 images allowed.`;
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

export const validateProductUploadSize = (variants: VariantForm[]) => {
  let totalBytes = 0;
  let totalFiles = 0;

  for (const variant of variants) {
    for (const image of variant.imagesFiles) {
      totalBytes += image.size;
      totalFiles += 1;
      if (!image.type.startsWith("image/")) {
        return `${image.name} is not a valid image file.`;
      }
      if (image.size > PRODUCT_IMAGE_MAX_BYTES) {
        return `${image.name} is ${formatBytes(image.size)}. Image limit is ${formatBytes(PRODUCT_IMAGE_MAX_BYTES)}.`;
      }
    }

    if (variant.videoFile) {
      totalBytes += variant.videoFile.size;
      totalFiles += 1;
      if (!variant.videoFile.type.startsWith("video/")) {
        return `${variant.videoFile.name} is not a valid video file.`;
      }
      if (variant.videoFile.size > PRODUCT_VIDEO_MAX_BYTES) {
        return `${variant.videoFile.name} is ${formatBytes(variant.videoFile.size)}. Video limit is ${formatBytes(PRODUCT_VIDEO_MAX_BYTES)}.`;
      }
    }
  }

  if (totalFiles > PRODUCT_UPLOAD_MAX_FILES) {
    return `Too many upload files. Maximum ${PRODUCT_UPLOAD_MAX_FILES} files are allowed.`;
  }

  if (totalBytes > PRODUCT_UPLOAD_MAX_BYTES) {
    return `Upload is ${formatBytes(totalBytes)}. Maximum total upload size is ${formatBytes(PRODUCT_UPLOAD_MAX_BYTES)}.`;
  }

  return "";
};
