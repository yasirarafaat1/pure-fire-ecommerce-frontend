"use client";

import { Eye, RefreshCcw, Search } from "lucide-react";
import { useState } from "react";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminPagination from "../components/AdminPagination";
import AdminStatusBadge from "../components/AdminStatusBadge";
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "../components/AdminStates";
import { useAdminList } from "../hooks/useAdminList";
import { AdminApiError, adminApi } from "../lib/adminApi";
import { formatInrFromPaise } from "../lib/money";
import CustomerDetailModal, { type CustomerDetail } from "./components/CustomerDetailModal";

type Customer = {
  _id: string;
  name?: string;
  email: string;
  phone?: string;
  status?: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt?: string;
  lastLoginAt?: string;
  blockedAt?: string;
};

type CustomerDetailResponse = {
  status: boolean;
  data: CustomerDetail;
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
};

export default function CustomersPage() {
  const list = useAdminList<Customer>("/customers");
  const [selectedEmail, setSelectedEmail] = useState("");
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);

  const openCustomer = async (email: string) => {
    setSelectedEmail(email);
    setDetail(null);
    setDetailError("");
    setDetailLoading(true);
    try {
      const response = await adminApi.get<CustomerDetailResponse>(
        `/customers/${encodeURIComponent(email)}`,
      );
      setDetail(response.data);
    } catch (error) {
      setDetailError(error instanceof AdminApiError ? error.message : "Unable to load customer");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeCustomer = () => {
    setSelectedEmail("");
    setDetail(null);
    setDetailError("");
  };

  const updateCustomerStatus = async (nextStatus: "ACTIVE" | "BLOCKED", reason?: string) => {
    if (!selectedEmail) return;
    setStatusUpdating(true);
    setDetailError("");
    try {
      await adminApi.patch(`/customers/${encodeURIComponent(selectedEmail)}/status`, {
        status: nextStatus,
        reason: reason || "",
      });
      await Promise.all([list.refresh(), openCustomer(selectedEmail)]);
    } catch (error) {
      setDetailError(error instanceof AdminApiError ? error.message : "Unable to update customer");
    } finally {
      setStatusUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Customers"
        description="View customer profiles, orders, addresses, activity and account access state."
        action={
          <button
            type="button"
            onClick={list.refresh}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        }
      />

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
          <label className="relative block w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              placeholder="Search name or email"
              value={String(list.filters.q || "")}
              onChange={(event) => list.updateFilters({ q: event.target.value })}
            />
          </label>
          <p className="text-sm text-slate-500">
            Click any customer to open full profile and activity.
          </p>
        </div>

        {list.loading ? (
          <AdminLoadingState />
        ) : list.error ? (
          <AdminErrorState message={list.error} retry={list.refresh} />
        ) : !list.items.length ? (
          <AdminEmptyState title="No customers found" description="Customers will appear after login or order activity." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">Total spent</th>
                  <th className="px-4 py-3">Last login</th>
                  <th className="px-4 py-3">Last order</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {list.items.map((customer) => (
                  <tr
                    key={customer._id || customer.email}
                    onClick={() => void openCustomer(customer.email)}
                    className="cursor-pointer transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-950">{customer.name || "Unnamed"}</p>
                      <p className="text-xs text-slate-500">{customer.email}</p>
                      <p className="text-xs text-slate-400">{customer.phone || "-"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <AdminStatusBadge status={customer.status || "ACTIVE"} />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{customer.orderCount}</td>
                    <td className="px-4 py-3">{formatInrFromPaise(customer.totalSpent)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(customer.lastLoginAt)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(customer.lastOrderAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void openCustomer(customer.email);
                        }}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AdminPagination
          pagination={list.pagination}
          onPage={list.setPage}
          onLimit={list.setLimit}
        />
      </section>

      <CustomerDetailModal
        open={Boolean(selectedEmail)}
        detail={detail}
        loading={detailLoading}
        error={detailError}
        statusUpdating={statusUpdating}
        onClose={closeCustomer}
        onRetry={() => selectedEmail && void openCustomer(selectedEmail)}
        onStatusChange={updateCustomerStatus}
      />
    </div>
  );
}
