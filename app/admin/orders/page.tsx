"use client";

import Link from "next/link";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminPagination from "../components/AdminPagination";
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "../components/AdminStates";
import AdminStatusBadge from "../components/AdminStatusBadge";
import { useAdminList } from "../hooks/useAdminList";
import { formatInrFromPaise } from "../lib/money";

type Order = {
  _id: string;
  order_id?: number;
  FullName?: string;
  user_email?: string;
  phone1?: string;
  amount?: number;
  payment_status?: string;
  status?: string;
  createdAt?: string;
};

const orderStatuses = [
  "PENDING",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURN_APPROVED",
  "RETURN_REJECTED",
  "REFUNDED",
  "REPLACED",
];

export default function OrdersPage() {
  const list = useAdminList<Order>("/orders");

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        title="Orders"
        description="Search and manage order, payment, shipping, cancellation, and return lifecycles."
      />
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[1fr_auto_auto]">
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Order ID, customer, email, or phone"
            value={String(list.filters.q || "")}
            onChange={(event) => list.updateFilters({ q: event.target.value })}
          />
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={String(list.filters.status || "")}
            onChange={(event) => list.updateFilters({ status: event.target.value })}
          >
            <option value="">All order statuses</option>
            {orderStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={String(list.filters.paymentStatus || "")}
            onChange={(event) => list.updateFilters({ paymentStatus: event.target.value })}
          >
            <option value="">All payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        {list.loading ? (
          <AdminLoadingState />
        ) : list.error ? (
          <AdminErrorState message={list.error} retry={list.refresh} />
        ) : !list.items.length ? (
          <AdminEmptyState title="No orders found" description="Change search or filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  {["Order", "Customer", "Contact", "Amount", "Payment", "Status", "Date", "Actions"].map((label) => (
                    <th className="px-4 py-3" key={label}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.items.map((order) => (
                  <tr className="border-t border-slate-100" key={order._id}>
                    <td className="px-4 py-3 font-medium">#{order.order_id || order._id}</td>
                    <td className="px-4 py-3">
                      <p>{order.FullName || "Unknown"}</p>
                      <p className="text-xs text-slate-500">{order.user_email || "-"}</p>
                    </td>
                    <td className="px-4 py-3">{order.phone1 || "-"}</td>
                    <td className="px-4 py-3">{formatInrFromPaise(order.amount)}</td>
                    <td className="px-4 py-3"><AdminStatusBadge status={order.payment_status} /></td>
                    <td className="px-4 py-3"><AdminStatusBadge status={order.status} /></td>
                    <td className="px-4 py-3">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                        href={`/admin/orders/${order.order_id || order._id}`}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <AdminPagination pagination={list.pagination} onPage={list.setPage} onLimit={list.setLimit} />
      </section>
    </div>
  );
}
