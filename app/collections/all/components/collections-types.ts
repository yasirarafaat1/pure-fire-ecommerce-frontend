export type CardProduct = {
  id: string | number;
  title: string;
  price: number;
  mrp: number;
  image: string;
  images: string[];
  rating?: number;
  reviews?: string | number;
  category?: string;
  categoryPath: string[];
  colors: string[];
  sizes: string[];
  fabric?: string;
  searchText?: string;
  contentText?: string;
  inStock: boolean;
  createdAt?: number;
  orderCount?: number;
};

export type FiltersState = {
  categories: string[];
  colors: string[];
  discounts: number[];
  ratings: number[];
  availability: string[];
  sizes: string[];
  fabrics: string[];
  price: { min: number; max: number };
};

export type AvailableFilters = {
  categories: string[];
  colors: string[];
  discounts: number[];
  ratings: number[];
  availability: string[];
  sizes: string[];
  fabrics: string[];
};
