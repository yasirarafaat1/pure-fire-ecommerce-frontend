export type OrderItem = {
  product_id?: number;
  quantity?: number;
  price?: number;
  product?: {
    title?: string;
    name?: string;
    product_image?: string | string[];
  };
};

export type Order = {
  _id?: string;
  order_id?: number;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  createdAt?: string;
  FullName?: string;
  phone1?: string;
  items?: OrderItem[];
  amount?: number;
  courier_name?: string;
  courier_rate?: number;
  courier_etd?: number;
  shiprocket_awb?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
};

export const formatMoney = (value: number) => {
  if (!Number.isFinite(value)) return "\u20B9 0";
  return `\u20B9 ${Math.round(value)}`;
};

export const formatOrderId = (orderId?: number | string) => {
  if (orderId === undefined || orderId === null) return "-";
  const raw = String(orderId);
  if (/^\d+$/.test(raw)) return raw.padStart(6, "0");
  return raw;
};

export const formatStatus = (value?: string) => {
  if (!value) return "Pending";
  return value
    .toString()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export const getOrderAmount = (order: Order) => {
  const items = order.items || [];
  const itemsTotal = items.reduce(
    (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 0),
    0,
  );
  const rawAmount = Number(order.amount || 0);
  let amount = itemsTotal || rawAmount;
  if (!itemsTotal && rawAmount > 0 && rawAmount % 100 === 0 && rawAmount >= 1000) {
    amount = rawAmount / 100;
  }
  return amount;
};

export const getOrderTitle = (order: Order) => {
  const firstItem = order.items?.[0];
  return firstItem?.product?.title || firstItem?.product?.name || "Order item";
};

export const getOrderQty = (order: Order) =>
  order.items?.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0) || 0;

export const getOrderImage = (order: Order) => {
  const firstItem = order.items?.[0];
  const rawImages = firstItem?.product?.product_image as any;
  return Array.isArray(rawImages) ? rawImages[0] : rawImages || "";
};

export const getOrderDate = (order: Order) =>
  order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-";

