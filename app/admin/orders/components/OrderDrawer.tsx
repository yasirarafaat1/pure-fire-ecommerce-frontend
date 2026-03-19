"use client";

import { Order, formatMoney, formatOrderId, formatStatus, getOrderAmount, getOrderDate, getOrderImage, getOrderQty, getOrderTitle } from "./ordersUtils";

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "out for delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

type Props = {
  order: Order | null;
  open: boolean;
  visible: boolean;
  draftStatus?: string;
  updating: boolean;
  onClose: () => void;
  onStatusChange: (value: string) => void;
  onUpdate: () => void;
};

export default function OrderDrawer({
  order,
  open,
  visible,
  draftStatus,
  updating,
  onClose,
  onStatusChange,
  onUpdate,
}: Props) {
  if (!visible || !order) return null;
  const amount = getOrderAmount(order);
  const date = getOrderDate(order);
  const qty = getOrderQty(order);
  const title = getOrderTitle(order);
  const image = getOrderImage(order);
  const statusValue = order.status || "pending";
  const nextStatus = draftStatus || statusValue;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className={`absolute inset-0 bg-black/30 auto-scroll transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
        aria-label="Close details"
      />
      <aside
        className={`absolute right-0 top-0 h-full w-[90%] max-w-md bg-white border-l border-black/15 p-5 grid gap-4 overflow-y-auto transition-transform duration-200 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Order Details</div>
          <button type="button" className="btn btn-ghost px-3 py-1" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="border-b border-t border-black/10 p-3 grid gap-2">
          <div className="text-xs text-[var(--muted)]">Order</div>
          <div className="text-sm font-semibold">#{formatOrderId(order.order_id || order._id)}</div>
          <div className="text-xs text-[var(--muted)]">Placed on {date}</div>
        </div>

        <div className="border-b border-t border-black/10 p-3 grid gap-3">
          <div className="text-sm font-semibold">Items</div>
          <div className="flex gap-3">
            <div className="w-16 h-16 rounded-[5px] border border-black/10 overflow-hidden bg-black/5">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt={title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-[var(--muted)]">
                  No image
                </div>
              )}
            </div>
            <div className="grid gap-1 text-sm">
              <div className="font-semibold">{title}</div>
              <div className="text-xs text-[var(--muted)]">Qty: {qty || 0}</div>
              <div className="text-sm">{formatMoney(amount)}</div>
            </div>
          </div>
        </div>

        <div className="border-b border-t border-black/10 p-3 grid gap-2 text-sm">
          <div className="font-semibold">Customer</div>
          <div>{order.FullName || "Customer"}</div>
          <div className="text-xs text-[var(--muted)]">{order.phone1 || "-"}</div>
        </div>

        <div className="border-b border-t border-black/10 p-3 grid gap-2 text-sm">
          <div className="font-semibold">Shipping</div>
          <div className="text-xs text-[var(--muted)]">Courier: {order.courier_name || "Not assigned"}</div>
          {order.courier_rate ? <div className="text-xs text-[var(--muted)]">Rate: {formatMoney(order.courier_rate)}</div> : null}
          {order.courier_etd ? <div className="text-xs text-[var(--muted)]">ETA: {order.courier_etd} days</div> : null}
          {order.shiprocket_awb ? <div className="text-xs text-[var(--muted)]">AWB: {order.shiprocket_awb}</div> : null}
        </div>

        <div className="border-b border-t border-black/10 p-3 grid gap-2 text-sm">
          <div className="font-semibold">Delivery address</div>
          <div className="text-xs text-[var(--muted)]">
            {order.address_line1 || ""}
            {order.city ? `, ${order.city}` : ""}
            {order.state ? `, ${order.state}` : ""}
            {order.country ? `, ${order.country}` : ""}
            {order.pinCode ? ` - ${order.pinCode}` : ""}
          </div>
        </div>

        <div className="border-b border-t border-black/10 p-3 grid gap-2 text-sm">
          <div className="font-semibold">Status</div>
          <div className="text-xs text-[var(--muted)]">Current: {formatStatus(statusValue)}</div>
          <select
            className="input h-9 text-sm border border-black/20 rounded-[5px]"
            value={nextStatus}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-primary h-9"
            onClick={onUpdate}
            disabled={updating || nextStatus === statusValue}
          >
            {updating ? "Updating..." : "Update status"}
          </button>
        </div>
      </aside>
    </div>
  );
}



