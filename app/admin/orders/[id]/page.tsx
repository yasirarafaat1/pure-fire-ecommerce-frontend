"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AdminPageHeader from "../../components/AdminPageHeader";
import { AdminErrorState, AdminLoadingState } from "../../components/AdminStates";
import AdminStatusBadge from "../../components/AdminStatusBadge";
import { AdminApiError, adminApi } from "../../lib/adminApi";
import { formatInrFromPaise } from "../../lib/money";

type OrderItem = { product_id: number; quantity: number; price: number; color?: string; size?: string; product?: { name?: string } };
type Timeline = { _id?: string; status: string; note?: string; createdAt?: string; adminId?: { name?: string; email?: string } };
type Order = {
  _id: string; order_id?: number; FullName?: string; user_email?: string; phone1?: string; amount?: number;
  payment_status?: string; payment_method?: string; status?: string; address_line1?: string; city?: string;
  state?: string; pinCode?: string; courier_name?: string; tracking_number?: string; tracking_url?: string;
  items: OrderItem[]; timeline?: Timeline[];
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [transitions, setTransitions] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const load = useCallback(() => adminApi.get<{ data: Order; allowedTransitions: string[] }>(`/orders/${params.id}`).then((response) => { setOrder(response.data); setTransitions(response.allowedTransitions); }).catch((requestError) => setError(requestError instanceof AdminApiError ? requestError.message : "Order failed")), [params.id]);
  useEffect(() => {
    void load();
  }, [load]);

  const transition = async (status: string) => {
    setSaving(true); setMessage("");
    try {
      const response = await adminApi.post<{ data: Order; message: string; allowedTransitions: string[] }>(`/orders/${params.id}/transition`, { status, note });
      setOrder(response.data); setTransitions(response.allowedTransitions); setMessage(response.message); setNote("");
    } catch (requestError) {
      setMessage(requestError instanceof AdminApiError ? requestError.message : "Transition failed");
    } finally { setSaving(false); }
  };

  if (error) return <AdminErrorState message={error} retry={load} />;
  if (!order) return <AdminLoadingState label="Loading order..." />;
  return (
    <div className="grid gap-6">
      <AdminPageHeader title={`Order #${order.order_id || order._id}`} description="Controlled order, payment, shipping, return, and refund lifecycle." />
      {message && <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">{message}</div>}
      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-6">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><h3 className="font-semibold">Items</h3><AdminStatusBadge status={order.status} /></div>
            <div className="mt-4 divide-y divide-slate-100">{order.items.map((item, index) => (
              <div className="flex items-center justify-between py-3 text-sm" key={`${item.product_id}-${index}`}>
                <div><p className="font-medium">{item.product?.name || `Product #${item.product_id}`}</p><p className="text-slate-500">{item.color || ""} {item.size || ""} · Qty {item.quantity}</p></div>
                <span>{formatInrFromPaise(item.price * item.quantity)}</span>
              </div>
            ))}</div>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold">Status timeline</h3>
            <div className="mt-4 border-l-2 border-slate-200 pl-5">{order.timeline?.length ? order.timeline.map((item, index) => (
              <div className="relative pb-5" key={item._id || index}><span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-slate-950" /><p className="text-sm font-medium">{item.status.replaceAll("_", " ")}</p><p className="text-xs text-slate-500">{item.note || "No note"} · {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</p></div>
            )) : <p className="text-sm text-slate-500">No timeline events recorded yet.</p>}</div>
          </article>
        </div>
        <div className="grid h-fit gap-6">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-semibold">Customer</h3><div className="mt-3 grid gap-1 text-sm text-slate-600"><p>{order.FullName || "Unknown"}</p><p>{order.user_email || "—"}</p><p>{order.phone1 || "—"}</p><p>{[order.address_line1, order.city, order.state, order.pinCode].filter(Boolean).join(", ") || "No address"}</p></div></article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-semibold">Payment</h3><div className="mt-3 flex items-center justify-between"><div><p className="text-2xl font-semibold">{formatInrFromPaise(order.amount)}</p><p className="text-sm text-slate-500">{order.payment_method || "Unknown method"}</p></div><AdminStatusBadge status={order.payment_status} /></div></article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-semibold">Next action</h3><textarea className="mt-3 min-h-20 w-full rounded-lg border border-slate-300 p-3 text-sm" placeholder="Admin note" value={note} onChange={(event) => setNote(event.target.value)} /><div className="mt-3 flex flex-wrap gap-2">{transitions.length ? transitions.map((status) => <button className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white disabled:opacity-60" disabled={saving} onClick={() => transition(status)} key={status}>{status.replaceAll("_", " ")}</button>) : <p className="text-sm text-slate-500">No further transitions available.</p>}</div></article>
        </div>
      </section>
    </div>
  );
}
