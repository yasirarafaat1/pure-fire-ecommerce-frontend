export type CartItem = {
  id: string | number;
  title: string;
  subcategory?: string;
  price: number;
  mrp?: number;
  qty: number;
  image: string;
  color?: string;
  size?: string;
};

export type ProductSummary = {
  _id?: string;
  product_id?: string | number;
  name?: string;
  title?: string;
  price?: number;
  selling_price?: number;
  discountedPrice?: number;
  mrp?: number;
  images?: string[];
  product_image?: string[];
};

export type RawCartItem = {
  product_id: string | number;
  title?: string;
  price?: number;
  mrp?: number;
  qty?: number;
  image?: string;
  color?: string;
  size?: string;
};
