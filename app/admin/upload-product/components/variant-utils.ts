export type VariantForm = {
  id: string;
  color: string;
  price: string;
  discountedPrice: string;
  sizes: { label: string; stock: string }[];
  imagesFiles: File[];
  videoFile: File | null;
  imagePreviews?: string[];
  videoPreview?: string;
  primary?: boolean;
};

export const blankVariant = (primary = false): VariantForm => ({
  id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
  color: "",
  price: "",
  discountedPrice: "",
  sizes: [{ label: "", stock: "" }],
  imagesFiles: [],
  videoFile: null,
  imagePreviews: [],
  videoPreview: "",
  primary,
});

export const toSizePayload = (sizes: { label: string; stock: string }[]) =>
  sizes
    .map((s) => ({ label: s.label.trim().toUpperCase(), stock: Number(s.stock || 0) }))
    .filter((s) => s.label);
