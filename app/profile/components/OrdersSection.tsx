"use client";

import { useEffect, useMemo, useState } from "react";
import { getUserEmail, getUserToken } from "../../utils/auth";

const API_BASE = "/api/user";

type OrderItem = {
  product_id?: number;
  quantity?: number;
  price?: number;
  product?: {
    title?: string;
    name?: string;
  };
};

type Order = {
  _id?: string;
  order_id?: number;
  status?: string;
  payment_status?: string;
  items?: OrderItem[];
  amount?: number;
  currency?: string;
  createdAt?: string;
};

type Props = {
  email?: string;
};

const formatMoney = (value: number) => {
  if (!Number.isFinite(value)) return "₹ 0";
  return `₹ ${Math.round(value)}`;
};

const formatOrderId = (orderId?: number | string) => {
  if (orderId === undefined || orderId === null) return "-";
  const raw = String(orderId);
  if (/^\d+$/.test(raw)) return raw.padStart(6, "0");
  return raw;
};

const formatStatus = (value?: string) => {
  if (!value) return "Pending";
  return value
    .toString()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function OrdersSection({ email }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const activeEmail = useMemo(() => {
    const normalized = (email || "").trim();
    return normalized || getUserEmail();
  }, [email]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        if (!activeEmail) {
          if (active) setOrders([]);
          return;
        }
        const res = await fetch(`${API_BASE}/get-orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-token": getUserToken(),
          },
          body: JSON.stringify({ email: activeEmail }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok || !data.status) throw new Error(data.message || "Failed to load orders");
        if (active) setOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch (err: any) {
        if (!active || err?.name === "AbortError") return;
        setError("Unable to load orders right now.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [activeEmail]);

  if (loading) {
    return (
      <div className="grid gap-3">
        {[1, 2, 3].map((id) => (
          <div
            key={id}
            className="border border-black/15 rounded-[5px] p-4 grid gap-2 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-32 bg-black/10 rounded" />
              <div className="h-3 w-20 bg-black/10 rounded" />
            </div>
            <div className="h-3 w-48 bg-black/10 rounded" />
            <div className="flex items-center gap-2">
              <div className="h-3 w-16 bg-black/10 rounded" />
              <div className="h-7 w-16 bg-black/10 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-sm text-[var(--muted)]">{error}</div>;
  }

  if (!orders.length) {
    return (
      <div className="border border-black/15 rounded-[5px] p-6 text-center grid gap-3">
        <div className="text-lg font-semibold">No orders yet</div>
        <div className="text-sm text-[var(--muted)]">
          Your order history will appear here once you place an order.
        </div>
        <div>
          <a href="/collections/all" className="btn btn-ghost px-4 py-2">
            Continue shopping
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {orders.map((order) => {
        const items = order.items || [];
        const totalQty = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0) || 0;
        const totalPrice = items.reduce(
          (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 0),
          0
        );
        const firstItem = items[0];
        const title = firstItem?.product?.title || firstItem?.product?.name || "Product";
        const extraCount = totalQty > 1 ? totalQty - 1 : 0;
        const line = `${title} x ${firstItem?.quantity || 1}${extraCount ? ` +${extraCount} more` : ""}`;

        const orderKey = order.order_id || order._id;
        const card = (
          <div className="border-b border-t border-black/15 p-4 grid gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">Order #{formatOrderId(order.order_id || order._id)}</span>
              <span className="text-[var(--muted)]">{formatStatus(order.status)}</span>
            </div>
            <div className="text-sm">{line}</div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">{formatMoney(totalPrice || order.amount || 0)}</span>
            </div>
          </div>
        );

        return (
          <div key={order._id || order.order_id}>
            {orderKey ? (
              <a href={`/orders/${orderKey}`} className="block">
                {card}
              </a>
            ) : (
              card
            )}
          </div>
        );
      })}
    </div>
  );
}
