"use client";

import { Order, formatMoney, formatOrderId, formatStatus, getOrderAmount, getOrderDate, getOrderImage, getOrderQty, getOrderTitle } from "./ordersUtils";

type Props = {
  orders: Order[];
  selectedId?: string | number | null;
  onSelect: (order: Order) => void;
};

export default function OrdersList({ orders, selectedId, onSelect }: Props) {
  return (
    <div className="border border-black/15 rounded-[5px] overflow-hidden">
      <div className="grid grid-cols-[110px_72px_1.6fr_70px_1fr_110px_110px_110px_110px] gap-2 px-4 py-3 text-[11px] text-[var(--muted)] border-b border-black/10 bg-white">
        <span>Order ID</span>
        <span>Image</span>
        <span>Title</span>
        <span>Qty</span>
        <span>Name</span>
        <span>Phone</span>
        <span>Date</span>
        <span>Amount</span>
        <span>Status</span>
      </div>
      <div className="grid">
        {orders.map((order) => {
          const key = order.order_id ?? order._id ?? "";
          const amount = getOrderAmount(order);
          const image = getOrderImage(order);
          const title = getOrderTitle(order);
          const qty = getOrderQty(order);
          const date = getOrderDate(order);
          const isActive = String(selectedId) === String(key);
          return (
            <button
              key={String(key)}
              type="button"
              onClick={() => onSelect(order)}
              className={`flex items-center grid grid-cols-[110px_72px_1.6fr_70px_1fr_110px_110px_110px_110px] gap-2 cursor-pointer px-4 py-3 text-sm text-left border-b border-black/5 hover:bg-black/5 transition-colors ${isActive ? "bg-black/5" : "bg-white"}`}
            >
              <span className="font-semibold">#{formatOrderId(order.order_id || order._id)}</span>
              <span className="w-16 h-16 rounded-[5px] border border-black/10 overflow-hidden bg-black/5">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt={title} className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-[10px] text-[var(--muted)]">No image</span>
                )}
              </span>
              <span className="font-semibold line-clamp-2">{title}</span>
              <span>{qty || 0}</span>
              <span className="text-[13px]">{order.FullName || "Customer"}</span>
              <span className="text-[13px]">{order.phone1 || "-"}</span>
              <span className="text-[13px]">{date}</span>
              <span className="font-semibold">{formatMoney(amount)}</span>
              <span className="text-[13px]">{formatStatus(order.status)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
