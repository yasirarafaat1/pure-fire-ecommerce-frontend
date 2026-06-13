export type ProductSize = { label: string; stock?: number | string };

export type ProductColorVariant = {
  color: string;
  price?: number;
  discountedPrice?: number;
  sizes?: Array<ProductSize | string>;
  images?: string[];
  video?: string;
  primary?: boolean;
};

export type EditProduct = {
  product_id?: number;
  draft_id?: number;
  name?: string;
  sku?: string;
  price?: number;
  selling_price?: number;
  quantity?: number;
  colors?: string[];
  sizes?: Array<ProductSize | string>;
  description?: string;
  key_highlights?: Array<{ key?: string; value?: string }>;
  colorVariants?: ProductColorVariant[];
  catagory_id?: string | { _id?: string };
  draft_stage?: string;
};

export type ProductFormState = {
  name: string;
  sku: string;
  price: string;
  selling_price: string;
  quantity: string;
  colors: string;
  sizes: string;
};
