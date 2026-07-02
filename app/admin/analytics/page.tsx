"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BotMessageSquare,
  Boxes,
  CircleDollarSign,
  MessageSquareText,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  ShoppingCart,
  Users,
  Warehouse,
} from "lucide-react";
import AdminPageHeader from "../components/AdminPageHeader";
import { AdminErrorState, AdminLoadingState } from "../components/AdminStates";
import { AdminApiError, adminApi } from "../lib/adminApi";
import {
  AnalyticsBarChart,
  AnalyticsEmptyState,
  AnalyticsKpiCard,
  AnalyticsLineChart,
  AnalyticsTableCard,
  formatCount,
  formatInr,
  formatPercent,
} from "./components";

type RangeKey = "7d" | "30d" | "90d" | "12m";
type SeriesRow = { date: string; revenue?: number; orders?: number; customers?: number };
type ProductRow = { productId: number; name?: string; sku?: string; orderCount?: number; quantitySold?: number; revenue?: number; quantity?: number; lowStockThreshold?: number };
type CustomerRow = { name?: string; email?: string; orderCount: number; revenue: number };

type AnalyticsData = {
  range: RangeKey;
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    deliveredOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    returnOrders: number;
    totalProducts: number;
    activeProducts: number;
    outOfStockProducts: number;
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    averageOrderValue: number;
    repeatPurchaseRate: number;
  };
  revenueSeries: SeriesRow[];
  orderSeries: SeriesRow[];
  orderStatusBreakdown: Array<{ status: string; count: number }>;
  topProducts: ProductRow[];
  productRevenue: ProductRow[];
  lowStockProducts: ProductRow[];
  outOfStockProducts: ProductRow[];
  customerSeries: SeriesRow[];
  topCustomers: CustomerRow[];
  categoryBreakdown: Array<{ category: string; orders: number; revenue: number }>;
  trackingAvailability: {
    productViews: { available: boolean; count: number };
    addToCart: { available: boolean; count: number };
    wishlist: { available: boolean; count: number };
  };
  assistant?: {
    kpis: {
      sessions: number;
      messages: number;
      userSessions: number;
      guestSessions: number;
      averageMessagesPerSession: number;
    };
    intentBreakdown: Array<{ intent: string; count: number }>;
    dailyMessages: Array<{ date: string; messages: number }>;
    feedbackBreakdown: Array<{ rating: string; count: number }>;
  };
};

const ranges: Array<{ label: string; value: RangeKey }> = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
  { label: "12 months", value: "12m" },
];

const dash = (value?: string | number | null) => (value === undefined || value === null || value === "" ? "-" : String(value));

export default function AnalyticsPage() {
  const [range, setRange] = useState<RangeKey>("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    adminApi
      .get<{ data: AnalyticsData }>(`/analytics/summary?range=${range}`)
      .then((response) => setData(response.data))
      .catch((requestError) =>
        setError(requestError instanceof AdminApiError ? requestError.message : "Analytics failed"),
      )
      .finally(() => setLoading(false));
  }, [range]);

  useEffect(() => {
    let active = true;
    adminApi
      .get<{ data: AnalyticsData }>(`/analytics/summary?range=${range}`)
      .then((response) => {
        if (active) setData(response.data);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError instanceof AdminApiError ? requestError.message : "Analytics failed");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [range]);

  const revenueOrders = useMemo(() => {
    const orderMap = new Map((data?.orderSeries || []).map((row) => [row.date, row.orders || 0]));
    return (data?.revenueSeries || []).map((row) => ({
      date: row.date,
      revenue: row.revenue || 0,
      orders: orderMap.get(row.date) || 0,
    }));
  }, [data]);

  if (error) return <AdminErrorState message={error} retry={load} />;
  if (loading || !data) return <AdminLoadingState label="Loading analytics..." />;

  const cards = [
    { label: "Total Revenue", value: formatInr(data.kpis.totalRevenue), icon: <CircleDollarSign size={18} /> },
    { label: "Total Orders", value: formatCount(data.kpis.totalOrders), icon: <ShoppingCart size={18} /> },
    { label: "Delivered Orders", value: formatCount(data.kpis.deliveredOrders), icon: <PackageCheck size={18} /> },
    { label: "Pending Orders", value: formatCount(data.kpis.pendingOrders), icon: <ShoppingCart size={18} /> },
    { label: "Cancelled Orders", value: formatCount(data.kpis.cancelledOrders), icon: <RotateCcw size={18} /> },
    { label: "Return Orders", value: formatCount(data.kpis.returnOrders), icon: <RotateCcw size={18} /> },
    { label: "Total Products", value: formatCount(data.kpis.totalProducts), icon: <Boxes size={18} /> },
    { label: "Active Products", value: formatCount(data.kpis.activeProducts), icon: <Warehouse size={18} /> },
    { label: "Out of Stock", value: formatCount(data.kpis.outOfStockProducts), icon: <Warehouse size={18} /> },
    { label: "Total Customers", value: formatCount(data.kpis.totalCustomers), icon: <Users size={18} /> },
    { label: "New Customers", value: formatCount(data.kpis.newCustomers), icon: <Users size={18} /> },
    { label: "Returning Customers", value: formatCount(data.kpis.returningCustomers), icon: <Users size={18} />, hint: `${formatPercent(data.kpis.repeatPurchaseRate)} repeat rate` },
    { label: "Average Order Value", value: formatInr(data.kpis.averageOrderValue), icon: <CircleDollarSign size={18} /> },
    { label: "Assistant Sessions", value: formatCount(data.assistant?.kpis.sessions), icon: <BotMessageSquare size={18} />, hint: `${formatCount(data.assistant?.kpis.userSessions)} user / ${formatCount(data.assistant?.kpis.guestSessions)} guest` },
    { label: "Assistant Messages", value: formatCount(data.assistant?.kpis.messages), icon: <MessageSquareText size={18} />, hint: `${formatCount(data.assistant?.kpis.averageMessagesPerSession)} avg per chat` },
  ];

  return (
    <div className="grid min-w-0 gap-6">
      <AdminPageHeader
        title="Analytics"
        description="Track sales, customers, products, and catalog performance."
        action={
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
            <select
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              value={range}
              onChange={(event) => {
                setLoading(true);
                setError("");
                setRange(event.target.value as RangeKey);
              }}
            >
              {ranges.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            <button className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white" onClick={load}>
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <AnalyticsKpiCard key={card.label} {...card} />
        ))}
      </section>

      <AnalyticsLineChart
        title="Revenue & Orders"
        data={revenueOrders}
        lines={[
          { key: "revenue", label: "Revenue", color: "#020617", currency: true },
          { key: "orders", label: "Orders", color: "#64748b" },
        ]}
      />

      <section className="grid min-w-0 gap-6 xl:grid-cols-2">
        <AnalyticsBarChart
          title="Order Status Breakdown"
          data={data.orderStatusBreakdown}
          xKey="status"
          bars={[{ key: "count", label: "Orders", color: "#020617" }]}
        />
        <AnalyticsBarChart
          title="Category Revenue & Orders"
          data={data.categoryBreakdown}
          xKey="category"
          bars={[
            { key: "revenue", label: "Revenue", color: "#020617", currency: true },
            { key: "orders", label: "Orders", color: "#94a3b8" },
          ]}
        />
      </section>

      <section className="grid min-w-0 gap-6 xl:grid-cols-2">
        <AnalyticsLineChart
          title="New Customers Over Time"
          data={data.customerSeries}
          lines={[{ key: "customers", label: "New Customers", color: "#020617" }]}
        />
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:border-slate-300 hover:shadow-md">
          <h3 className="font-semibold text-slate-950">Tracking Insights</h3>
          <div className="mt-4 grid gap-3">
            {data.trackingAvailability.productViews.available ? (
              <TrackingRow label="Product views" value={data.trackingAvailability.productViews.count} />
            ) : (
              <AnalyticsEmptyState />
            )}
            <TrackingRow label="Active cart records" value={data.trackingAvailability.addToCart.count} />
            <TrackingRow label="Wishlist records" value={data.trackingAvailability.wishlist.count} />
          </div>
        </div>
      </section>

      <section className="grid min-w-0 gap-6 xl:grid-cols-2">
        <AnalyticsBarChart
          title="Assistant Top Intents"
          data={data.assistant?.intentBreakdown || []}
          xKey="intent"
          bars={[{ key: "count", label: "Chats", color: "#020617" }]}
        />
        <AnalyticsLineChart
          title="Assistant Messages Over Time"
          data={data.assistant?.dailyMessages || []}
          lines={[{ key: "messages", label: "Messages", color: "#16a34a" }]}
        />
      </section>

      <section className="grid min-w-0 gap-6 xl:grid-cols-2">
        <AnalyticsTableCard
          title="Most Bought Products"
          rows={data.topProducts}
          columns={[
            { key: "name", label: "Product", render: (row) => dash(row.name || `Product #${row.productId}`) },
            { key: "orders", label: "Orders", render: (row) => formatCount(row.orderCount) },
            { key: "qty", label: "Qty Sold", render: (row) => formatCount(row.quantitySold) },
            { key: "revenue", label: "Revenue", render: (row) => formatInr(row.revenue) },
          ]}
        />
        <AnalyticsTableCard
          title="Most Revenue Products"
          rows={data.productRevenue}
          columns={[
            { key: "name", label: "Product", render: (row) => dash(row.name || `Product #${row.productId}`) },
            { key: "sku", label: "SKU", render: (row) => dash(row.sku) },
            { key: "qty", label: "Qty Sold", render: (row) => formatCount(row.quantitySold) },
            { key: "revenue", label: "Revenue", render: (row) => formatInr(row.revenue) },
          ]}
        />
      </section>

      <section className="grid min-w-0 gap-6 xl:grid-cols-2">
        <AnalyticsTableCard
          title="Top Customers"
          rows={data.topCustomers}
          columns={[
            { key: "name", label: "Customer", render: (row) => <div><p>{dash(row.name)}</p><p className="text-xs text-slate-500">{dash(row.email)}</p></div> },
            { key: "orders", label: "Orders", render: (row) => formatCount(row.orderCount) },
            { key: "revenue", label: "Revenue", render: (row) => formatInr(row.revenue) },
          ]}
        />
        <AnalyticsTableCard
          title="Low Stock Products"
          rows={data.lowStockProducts}
          columns={[
            { key: "name", label: "Product", render: (row) => dash(row.name || `Product #${row.productId}`) },
            { key: "sku", label: "SKU", render: (row) => dash(row.sku) },
            { key: "stock", label: "Stock", render: (row) => formatCount(row.quantity) },
            { key: "threshold", label: "Threshold", render: (row) => formatCount(row.lowStockThreshold) },
          ]}
        />
      </section>

      <AnalyticsTableCard
        title="Out of Stock Products"
        rows={data.outOfStockProducts}
        columns={[
          { key: "name", label: "Product", render: (row) => dash(row.name || `Product #${row.productId}`) },
          { key: "sku", label: "SKU", render: (row) => dash(row.sku) },
          { key: "stock", label: "Stock", render: (row) => formatCount(row.quantity) },
        ]}
      />
    </div>
  );
}

function TrackingRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-3 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <span className="text-slate-950">{formatCount(value)}</span>
    </div>
  );
}
