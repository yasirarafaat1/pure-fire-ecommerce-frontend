"use client";

import { Ban, CheckCircle2, LoaderCircle, ShieldCheck, X } from "lucide-react";
import { useMemo } from "react";
import type { ReactNode } from "react";
import AdminStatusBadge from "../../components/AdminStatusBadge";
import { formatInr, formatInrFromPaise } from "../../lib/money";

type CustomerProfile = {
  email: string;
  name?: string;
  gender?: string;
  status?: string;
  blockedAt?: string | null;
  blockReason?: string;
  lastLoginAt?: string | null;
  createdAt?: string;
};

type CustomerOrder = {
  _id: string;
  order_id?: number;
  status?: string;
  payment_status?: string;
  amount?: number;
  createdAt?: string;
  items?: { title?: string; name?: string; quantity?: number }[];
};

type CustomerAddress = {
  _id: string;
  full_name?: string;
  FullName?: string;
  address_line1?: string;
  address_line2?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  pinCode?: string;
  addressType?: string;
  createdAt?: string;
};

type CustomerSession = {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
  expiresAt?: string;
  active: boolean;
};

type ProductPreview = {
  _id: string;
  product_id: number;
  title: string;
  image?: string;
  price?: number;
  mrp?: number;
  status?: string;
};

export type CustomerDetail = {
  profile: CustomerProfile;
  orders: CustomerOrder[];
  addresses: CustomerAddress[];
  sessions: CustomerSession[];
  activity: {
    recentSearches: string[];
    recentViewedProductIds: number[];
    suggestedProductIds: number[];
    recentViewedProducts: ProductPreview[];
    updatedAt?: string | null;
  };
  wishlist: {
    count: number;
    products: ProductPreview[];
  };
  summary: {
    orderCount: number;
    totalSpent: number;
    lastOrderAt?: string | null;
    addressCount: number;
    activeSessionCount: number;
    wishlistCount: number;
    recentSearchCount: number;
  };
};

type Props = {
  open: boolean;
  detail: CustomerDetail | null;
  loading: boolean;
  error: string;
  statusUpdating: boolean;
  onClose: () => void;
  onRetry: () => void;
  onStatusChange: (status: "ACTIVE" | "BLOCKED", reason?: string) => void;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
};

const addressLine = (address: CustomerAddress) =>
  [
    address.address_line1 || address.address,
    address.address_line2,
    address.city,
    address.state,
    address.postal_code || address.pinCode,
  ]
    .filter(Boolean)
    .join(", ");

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ProductStrip({ products }: { products: ProductPreview[] }) {
  if (!products.length) {
    return <p className="text-sm text-slate-500">No product activity found.</p>;
  }

  return (
    <div className="grid max-h-72 gap-3 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {products.map((product) => (
        <div key={product._id || product.product_id} className="flex gap-3 rounded-xl border border-slate-200 p-2">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
            {product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-950">{product.title}</p>
            <p className="text-xs text-slate-500">ID: {product.product_id}</p>
            <p className="text-xs font-semibold text-slate-700">
              {formatInr(Number(product.price || 0))}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CustomerDetailModal({
  open,
  detail,
  loading,
  error,
  statusUpdating,
  onClose,
  onRetry,
  onStatusChange,
}: Props) {
  const blocked = String(detail?.profile.status || "ACTIVE").toUpperCase() === "BLOCKED";
  const statusAction = blocked ? "ACTIVE" : "BLOCKED";
  const statusLabel = blocked ? "Unblock customer" : "Block customer";
  const searchText = useMemo(
    () => detail?.activity.recentSearches.filter(Boolean).join(", ") || "",
    [detail?.activity.recentSearches],
  );

  if (!open) return null;

  const confirmStatusChange = () => {
    const reason =
      statusAction === "BLOCKED"
        ? window.prompt("Reason for blocking this customer?") || ""
        : "";
    if (statusAction === "BLOCKED" && !window.confirm("Block this customer and revoke active sessions?")) {
      return;
    }
    if (statusAction === "ACTIVE" && !window.confirm("Unblock this customer?")) {
      return;
    }
    onStatusChange(statusAction, reason);
  };

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-slate-950/30">
      <button type="button" aria-label="Close customer profile" className="absolute inset-0 cursor-default" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-4xl flex-col bg-slate-50 shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer profile</p>
            <h2 className="mt-1 truncate text-xl font-semibold text-slate-950">
              {detail?.profile.name || detail?.profile.email || "Customer"}
            </h2>
            <p className="truncate text-sm text-slate-500">{detail?.profile.email || ""}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {detail ? <AdminStatusBadge status={detail.profile.status || "ACTIVE"} /> : null}
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {loading ? (
            <div className="grid min-h-96 place-items-center text-sm text-slate-500">
              <span className="inline-flex items-center gap-2">
                <LoaderCircle className="animate-spin" size={18} />
                Loading customer profile...
              </span>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">Unable to load customer</p>
              <p className="mt-1">{error}</p>
              <button type="button" onClick={onRetry} className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-white">
                Try again
              </button>
            </div>
          ) : detail ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Orders" value={detail.summary.orderCount} />
                <StatCard label="Total spent" value={formatInrFromPaise(detail.summary.totalSpent)} />
                <StatCard label="Addresses" value={detail.summary.addressCount} />
                <StatCard label="Active sessions" value={detail.summary.activeSessionCount} />
              </div>

              <Section title="Access control">
                <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {blocked ? "Customer is blocked" : "Customer can login"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {blocked
                        ? `Blocked at ${formatDateTime(detail.profile.blockedAt)}${detail.profile.blockReason ? ` - ${detail.profile.blockReason}` : ""}`
                        : `Last login ${formatDateTime(detail.profile.lastLoginAt)}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={statusUpdating}
                    onClick={confirmStatusChange}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${
                      blocked ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {statusUpdating ? <LoaderCircle className="animate-spin" size={16} /> : blocked ? <CheckCircle2 size={16} /> : <Ban size={16} />}
                    {statusLabel}
                  </button>
                </div>
              </Section>

              <div className="grid gap-4 lg:grid-cols-2">
                <Section title="Profile">
                  <dl className="grid gap-3 text-sm">
                    <div><dt className="text-slate-500">Email</dt><dd className="font-medium text-slate-950">{detail.profile.email}</dd></div>
                    <div><dt className="text-slate-500">Name</dt><dd className="font-medium text-slate-950">{detail.profile.name || "-"}</dd></div>
                    <div><dt className="text-slate-500">Gender</dt><dd className="font-medium text-slate-950">{detail.profile.gender || "-"}</dd></div>
                    <div><dt className="text-slate-500">Joined</dt><dd className="font-medium text-slate-950">{formatDateTime(detail.profile.createdAt)}</dd></div>
                  </dl>
                </Section>

                <Section title="Login sessions">
                  {!detail.sessions.length ? (
                    <p className="text-sm text-slate-500">No saved sessions.</p>
                  ) : (
                    <div className="grid max-h-64 gap-2 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {detail.sessions.map((session) => (
                        <div key={session._id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm">
                          <div>
                            <p className="font-semibold text-slate-950">{formatDateTime(session.createdAt)}</p>
                            <p className="text-xs text-slate-500">Expires {formatDateTime(session.expiresAt)}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${session.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                            <ShieldCheck size={12} />
                            {session.active ? "Active" : "Expired"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
              </div>

              <Section title="Activity">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent searches</p>
                    {searchText ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {detail.activity.recentSearches.map((term) => (
                          <span key={term} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{term}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">No search activity found.</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent viewed products</p>
                    <div className="mt-2">
                      <ProductStrip products={detail.activity.recentViewedProducts} />
                    </div>
                  </div>
                </div>
              </Section>

              <div className="grid gap-4 lg:grid-cols-2">
                <Section title={`Wishlist (${detail.wishlist.count})`}>
                  <ProductStrip products={detail.wishlist.products} />
                </Section>

                <Section title="Addresses">
                  {!detail.addresses.length ? (
                    <p className="text-sm text-slate-500">No addresses saved.</p>
                  ) : (
                    <div className="grid max-h-72 gap-3 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {detail.addresses.map((address) => (
                        <div key={address._id} className="rounded-xl border border-slate-200 p-3 text-sm">
                          <p className="font-semibold text-slate-950">{address.FullName || address.full_name || "Address"}</p>
                          <p className="mt-1 text-slate-600">{addressLine(address) || "-"}</p>
                          <p className="mt-1 text-xs text-slate-500">{address.addressType || "Saved address"}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
              </div>

              <Section title="Recent orders">
                {!detail.orders.length ? (
                  <p className="text-sm text-slate-500">No orders found.</p>
                ) : (
                  <div className="grid max-h-96 gap-3 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {detail.orders.map((order) => (
                      <div key={order._id} className="rounded-xl border border-slate-200 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-950">Order #{order.order_id || order._id}</p>
                            <p className="text-xs text-slate-500">{formatDateTime(order.createdAt)}</p>
                          </div>
                          <div className="flex gap-2">
                            <AdminStatusBadge status={order.payment_status || "PENDING"} />
                            <AdminStatusBadge status={order.status || "PENDING"} />
                          </div>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-slate-800">{formatInrFromPaise(Number(order.amount || 0))}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {(order.items || []).slice(0, 3).map((item) => item.title || item.name || "Item").join(", ") || "No item preview"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
