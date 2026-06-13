"use client";

import { useEffect, useState } from "react";
import { CircleDollarSign, Package, ShoppingCart, Star, Users, Warehouse } from "lucide-react";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminStatusBadge from "../components/AdminStatusBadge";
import { AdminErrorState, AdminLoadingState } from "../components/AdminStates";
import { AdminApiError, adminApi } from "../lib/adminApi";
import { formatInrFromPaise } from "../lib/money";

type DashboardData = {
  metrics: {
    totalRevenue: number;
    todayRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    lowStockProducts: number;
    activeProducts: number;
    customers: number;
    pendingReviews: number;
  };
  recentOrders: Array<{
    _id: string;
    order_id?: number;
    FullName?: string;
    amount?: number;
    status?: string;
    createdAt?: string;
  }>;
  topProducts: Array<{ productId: number; name?: string; quantity: number }>;
  recentActivity: Array<{
    _id: string;
    adminEmail: string;
    action: string;
    entityType: string;
    createdAt: string;
  }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const load = () => {
    setError("");
    adminApi
      .get<{ data: DashboardData }>("/dashboard")
      .then((response) => setData(response.data))
      .catch((requestError) =>
        setError(requestError instanceof AdminApiError ? requestError.message : "Dashboard failed")
      );
  };
  useEffect(() => {
    adminApi
      .get<{ data: DashboardData }>("/dashboard")
      .then((response) => setData(response.data))
      .catch((requestError) =>
        setError(requestError instanceof AdminApiError ? requestError.message : "Dashboard failed")
      );
  }, []);

  if (error) return <AdminErrorState message={error} retry={load} />;
  if (!data) return <AdminLoadingState label="Loading dashboard..." />;

  const cards = [
    { label: "Total revenue", value: formatInrFromPaise(data.metrics.totalRevenue), icon: CircleDollarSign },
    { label: "Today revenue", value: formatInrFromPaise(data.metrics.todayRevenue), icon: CircleDollarSign },
    { label: "Total orders", value: data.metrics.totalOrders, icon: ShoppingCart },
    { label: "Pending orders", value: data.metrics.pendingOrders, icon: Package },
    { label: "Active products", value: data.metrics.activeProducts, icon: Warehouse },
    { label: "Low stock", value: data.metrics.lowStockProducts, icon: Warehouse },
    { label: "Customers", value: data.metrics.customers, icon: Users },
    { label: "Reviews pending", value: data.metrics.pendingReviews, icon: Star },
  ];

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        title="Dashboard"
        description="Live commerce, customer, catalog, and administration overview."
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" key={label}>
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-sm">{label}</span>
              <Icon size={18} />
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
          </article>
        ))}
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="font-semibold">Recent orders</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order) => (
                  <tr className="border-t border-slate-100" key={order._id}>
                    <td className="px-5 py-3 font-medium">#{order.order_id || order._id}</td>
                    <td className="px-5 py-3">{order.FullName || "Unknown"}</td>
                    <td className="px-5 py-3">{formatInrFromPaise(order.amount)}</td>
                    <td className="px-5 py-3"><AdminStatusBadge status={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold">Top selling products</h3>
          <div className="mt-4 grid gap-3">
            {data.topProducts.length ? data.topProducts.map((product) => (
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-3" key={product.productId}>
                <span className="text-sm font-medium">{product.name || `Product #${product.productId}`}</span>
                <span className="text-sm text-slate-500">{product.quantity} sold</span>
              </div>
            )) : <p className="text-sm text-slate-500">No sales data available.</p>}
          </div>
          <h3 className="mt-6 font-semibold">Recent admin activity</h3>
          <div className="mt-3 grid gap-3">
            {data.recentActivity.map((item) => (
              <div key={item._id}>
                <p className="text-sm font-medium">{item.action.replaceAll("_", " ")}</p>
                <p className="text-xs text-slate-500">{item.adminEmail || "System"} · {item.entityType}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
