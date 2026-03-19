export type OrderItem = {
  product_id?: number;
  quantity?: number;
  price?: number;
  color?: string;
  size?: string;
  image?: string;
  images?: string[];
  product?: {
    title?: string;
    name?: string;
    product_image?: string | string[];
    colorVariants?: Array<{ color?: string; images?: string[] }>;
  };
};

export type Order = {
  _id?: string;
  order_id?: number;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  items?: OrderItem[];
  amount?: number;
  currency?: string;
  createdAt?: string;
  FullName?: string;
  phone1?: string;
  phone2?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  addressType?: string;
  courier_name?: string;
  courier_rate?: number;
  courier_etd?: number;
  shiprocket_awb?: string;
};

export const formatMoney = (value: number) => {
  if (!Number.isFinite(value)) return "₹ 0";
  return `₹ ${Math.round(value)}`;
};

export const formatStatus = (value?: string) => {
  if (!value) return "Pending";
  return value
    .toString()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export const formatOrderId = (orderId?: number | string) => {
  if (orderId === undefined || orderId === null) return "-";
  const raw = String(orderId);
  if (/^\d+$/.test(raw)) return raw.padStart(6, "0");
  return raw;
};
