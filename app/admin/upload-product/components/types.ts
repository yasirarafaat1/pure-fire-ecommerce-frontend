import type { ReactElement } from "react";

export type CategoryNode = { _id: string; name: string; children?: CategoryNode[] };
export type ProductFormKey =
  | "name"
  | "sku"
  | "price"
  | "selling_price"
  | "quantity"
  | "colors"
  | "sizes";
export type FieldRenderer = (
  key: ProductFormKey,
  label: string,
  placeholder: string,
  asTextArea?: boolean
) => ReactElement;
export type Highlight = { key: string; value: string };
