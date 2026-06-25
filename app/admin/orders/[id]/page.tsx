"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Download, Eye } from "lucide-react";
import AdminPageHeader from "../../components/AdminPageHeader";
import { AdminErrorState, AdminLoadingState } from "../../components/AdminStates";
import AdminStatusBadge from "../../components/AdminStatusBadge";
import { AdminApiError, adminApi } from "../../lib/adminApi";
import { formatInr, formatInrFromPaise } from "../../lib/money";

type OrderItem = {
  product_id: number;
  quantity: number;
  price: number;
  color?: string;
  size?: string;
  product?: { name?: string; title?: string; sku?: string; price?: number; selling_price?: number };
};
type Timeline = { _id?: string; status: string; note?: string; createdAt?: string; adminId?: { name?: string; email?: string } };
type Order = {
  _id: string;
  order_id?: number;
  FullName?: string;
  user_email?: string;
  phone1?: string;
  phone2?: string;
  amount?: number;
  currency?: string;
  payment_status?: string;
  payment_method?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  payu_payment_id?: string;
  status?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  addressType?: string;
  courier_rate?: number;
  createdAt?: string;
  updatedAt?: string;
  shippedAt?: string;
  items: OrderItem[];
  timeline?: Timeline[];
};

type InvoiceListItem = { _id: string; invoiceNumber: string; orderNumber?: number };

const dash = (value: unknown) => {
  if (value === undefined || value === null || value === "") return "-";
  return String(value);
};

const formatDate = (value?: string) => (value ? new Date(value).toLocaleString() : "-");

const downloadBlob = async (url: string, filename: string) => {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message || "Download failed");
  }
  const blob = await response.blob();
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [transitions, setTransitions] = useState<string[]>([]);
  const [invoice, setInvoice] = useState<InvoiceListItem | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    adminApi
      .get<{ data: Order; allowedTransitions: string[] }>(`/orders/${params.id}`)
      .then((response) => {
        setOrder(response.data);
        setTransitions(response.allowedTransitions);
      })
      .catch((requestError) =>
        setError(requestError instanceof AdminApiError ? requestError.message : "Order failed"),
      );
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!order?.order_id || String(order.status || "").toUpperCase() !== "DELIVERED") return;
    adminApi
      .get<{ data: InvoiceListItem[] }>(`/invoices?search=${encodeURIComponent(String(order.order_id))}&limit=10`)
      .then((response) => {
        setInvoice(response.data.find((item) => item.orderNumber === order.order_id) || response.data[0] || null);
      })
      .catch(() => setInvoice(null));
  }, [order?.order_id, order?.status]);

  const transition = async (status: string) => {
    setSaving(true);
    setMessage("");
    try {
      const response = await adminApi.post<{ data: Order; message: string; allowedTransitions: string[] }>(
        `/orders/${params.id}/transition`,
        { status, note },
      );
      setOrder(response.data);
      setTransitions(response.allowedTransitions);
      setMessage(response.message);
      setNote("");
    } catch (requestError) {
      setMessage(requestError instanceof AdminApiError ? requestError.message : "Transition failed");
    } finally {
      setSaving(false);
    }
  };

  const ensureInvoice = async () => {
    if (!order?.order_id) throw new Error("Invoice is not available yet.");
    const response = await adminApi.post<{ data: InvoiceListItem }>(`/invoices/ensure-for-order/${order.order_id}`);
    setInvoice(response.data);
    return response.data;
  };

  const downloadInvoice = async () => {
    setMessage("");
    try {
      const currentInvoice = invoice || (await ensureInvoice());
      await downloadBlob(`/api/admin/invoices/${currentInvoice._id}/download`, `${currentInvoice.invoiceNumber}.pdf`);
    } catch (requestError) {
      setMessage(requestError instanceof Error ? requestError.message : "Invoice is not available yet.");
    }
  };

  if (error) return <AdminErrorState message={error} retry={load} />;
  if (!order) return <AdminLoadingState label="Loading order..." />;

  const delivered = String(order.status || "").toUpperCase() === "DELIVERED";
  const deliveredAt = [...(order.timeline || [])]
    .reverse()
    .find((entry) => String(entry.status || "").toUpperCase() === "DELIVERED")?.createdAt;
  const transactionId = order.razorpay_payment_id || order.payu_payment_id || order.razorpay_order_id || "";
  const provider = order.razorpay_payment_id || order.razorpay_order_id ? "Razorpay" : order.payu_payment_id ? "PayU" : "";
  const shippingAddress = [order.address_line1, order.city, order.state, order.pinCode, order.country].filter(Boolean).join(", ");
  const subtotal = (order.items || []).reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
  const grandTotal = Number(order.amount || 0) / 100;
  const shipping = Math.max(0, grandTotal - subtotal);
  const rows: Array<[string, string]> = [
    ["Order Number", order.order_id ? `#${order.order_id}` : "-"],
    ["Order Date", formatDate(order.createdAt)],
    ["Order Status", dash(order.status)],
    ["Delivered Date", formatDate(deliveredAt)],
    ["Customer Name", dash(order.FullName)],
    ["Customer Email", dash(order.user_email)],
    ["Customer Phone", dash(order.phone1 || order.phone2)],
    ["Shipping Address", dash(shippingAddress)],
  ];
  const paymentRows: Array<[string, string]> = [
    ["Payment Method", dash(order.payment_method)],
    ["Payment Status", dash(order.payment_status)],
    ["Transaction ID", dash(transactionId)],
    ["Payment Gateway/Provider", dash(provider)],
    ["Paid Amount", formatInrFromPaise(order.amount)],
    ["Payment Date", formatDate(order.updatedAt || order.createdAt)],
    ["Currency", dash(order.currency)],
  ];
  const totalRows: Array<[string, string]> = [
    ["Subtotal", formatInr(subtotal)],
    ["Discount", "-"],
    ["Shipping Charge", shipping ? formatInr(shipping) : "-"],
    ["GST/Tax", "-"],
    ["Grand Total", formatInrFromPaise(order.amount)],
  ];

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        title={`Order #${order.order_id || order._id}`}
        description="Controlled order, payment, shipping, return, and refund lifecycle."
        action={
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm" onClick={() => router.back()}>
              <ArrowLeft size={16} />
              Back
            </button>
            {delivered && invoice && (
              <Link className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm" href={`/admin/invoices/${invoice._id}`}>
                <Eye size={16} />
                View Invoice
              </Link>
            )}
            {delivered && (
              <button className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white" onClick={downloadInvoice}>
                <Download size={16} />
                Download Invoice
              </button>
            )}
          </div>
        }
      />
      {message && <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">{message}</div>}
      <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="grid gap-6">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Items</h3>
              <AdminStatusBadge status={order.status} />
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    {["Product", "SKU", "Variant", "Qty", "Rate", "Amount"].map((label) => (
                      <th className="px-3 py-2" key={label}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr className="border-t border-slate-100" key={`${item.product_id}-${index}`}>
                      <td className="px-3 py-2">{item.product?.title || item.product?.name || `Product #${item.product_id}`}</td>
                      <td className="px-3 py-2">{dash(item.product?.sku)}</td>
                      <td className="px-3 py-2">{dash([item.color, item.size].filter(Boolean).join(" / "))}</td>
                      <td className="px-3 py-2">{dash(item.quantity)}</td>
                      <td className="px-3 py-2">{formatInr(item.price)}</td>
                      <td className="px-3 py-2">{formatInr((Number(item.price) || 0) * (Number(item.quantity) || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold">Status timeline</h3>
            <div className="mt-4 border-l-2 border-slate-200 pl-5">
              {order.timeline?.length ? order.timeline.map((item, index) => (
                <div className="relative pb-5" key={item._id || index}>
                  <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-slate-950" />
                  <p className="text-sm font-medium">{dash(item.status).replaceAll("_", " ")}</p>
                  <p className="text-xs text-slate-500">{dash(item.note)} - {formatDate(item.createdAt)}</p>
                </div>
              )) : <p className="text-sm text-slate-500">No timeline events recorded yet.</p>}
            </div>
          </article>
        </div>
        <div className="grid h-fit gap-6">
          <InfoCard title="Order information" rows={rows} />
          <InfoCard title="Payment information" rows={paymentRows} />
          <InfoCard title="Order totals" rows={totalRows} />
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold">Next action</h3>
            <textarea className="mt-3 min-h-20 w-full rounded-lg border border-slate-300 p-3 text-sm" placeholder="Admin note" value={note} onChange={(event) => setNote(event.target.value)} />
            <div className="mt-3 flex flex-wrap gap-2">
              {transitions.length ? transitions.map((status) => (
                <button className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white disabled:opacity-60" disabled={saving} onClick={() => transition(status)} key={status}>
                  {status.replaceAll("_", " ")}
                </button>
              )) : <p className="text-sm text-slate-500">No further transitions available.</p>}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

function InfoCard({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-3 grid gap-2 text-sm">
        {rows.map(([label, value]) => (
          <div className="grid grid-cols-[150px_1fr] gap-3" key={label}>
            <span className="text-slate-500">{label}</span>
            <span className="break-words">{value || "-"}</span>
          </div>
        ))}
      </div>
    </article>
  );
}
