"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download, Eye } from "lucide-react";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminPagination from "../components/AdminPagination";
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "../components/AdminStates";
import { useAdminList } from "../hooks/useAdminList";
import { formatInr } from "../lib/money";

type Invoice = {
  _id: string;
  invoiceNumber: string;
  orderNumber?: number;
  issuedAt?: string;
  companySnapshot?: { gstin?: string };
  customerSnapshot?: { name?: string; phone?: string; email?: string };
  orderSnapshot?: { paymentMethod?: string; transactionId?: string };
  totals?: { grandTotal?: number };
};

const dash = (value: unknown) => (value === undefined || value === null || value === "" ? "-" : String(value));

const downloadBlob = async (url: string, filename: string, body?: unknown) => {
  const response = await fetch(url, {
    method: body ? "POST" : "GET",
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
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

export default function InvoicesPage() {
  const router = useRouter();
  const list = useAdminList<Invoice>("/invoices");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const toggle = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id],
    );
  };

  const bulkDownload = async () => {
    setMessage("");
    const ids = selectedIds.slice(0, 50);
    if (!ids.length) {
      setMessage("Select at least one invoice.");
      return;
    }
    try {
      await downloadBlob("/api/admin/invoices/bulk-download", "invoices.zip", { ids });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bulk download failed");
    }
  };

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        title="Invoices"
        description="Delivered order invoices generated from immutable order snapshots."
      />
      {message && <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">{message}</div>}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[1fr_auto]">
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Invoice, order ID, customer, email, or transaction"
            value={String(list.filters.search || "")}
            onChange={(event) => list.updateFilters({ search: event.target.value })}
          />
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white"
            onClick={bulkDownload}
          >
            <Download size={16} />
            Bulk Download
          </button>
        </div>
        {list.loading ? (
          <AdminLoadingState />
        ) : list.error ? (
          <AdminErrorState message={list.error} retry={list.refresh} />
        ) : !list.items.length ? (
          <AdminEmptyState title="No invoices found" description="Invoices appear after orders are delivered." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  {["", "Invoice number", "Order ID", "Customer", "Payment method", "Transaction ID", "Invoice date", "GSTIN", "Grand total", "Actions"].map((label) => (
                    <th className="px-4 py-3" key={label}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.items.map((invoice) => (
                  <tr className="cursor-pointer border-t border-slate-100 hover:bg-slate-50" key={invoice._id} onClick={() => router.push(`/admin/invoices/${invoice._id}`)}>
                    <td className="px-4 py-3">
                      <input
                        aria-label={`Select ${invoice.invoiceNumber}`}
                        className="h-4 w-4"
                        type="checkbox"
                        value={invoice._id}
                        checked={selectedIds.includes(invoice._id)}
                        onClick={(event) => event.stopPropagation()}
                        onChange={() => toggle(invoice._id)}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{dash(invoice.invoiceNumber)}</td>
                    <td className="px-4 py-3">{invoice.orderNumber ? `#${invoice.orderNumber}` : "-"}</td>
                    <td className="px-4 py-3">
                      <p>{dash(invoice.customerSnapshot?.name)}</p>
                      <p className="text-xs text-slate-500">{dash(invoice.customerSnapshot?.email || invoice.customerSnapshot?.phone)}</p>
                    </td>
                    <td className="px-4 py-3">{dash(invoice.orderSnapshot?.paymentMethod)}</td>
                    <td className="px-4 py-3">{dash(invoice.orderSnapshot?.transactionId)}</td>
                    <td className="px-4 py-3">{invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString() : "-"}</td>
                    <td className="px-4 py-3">{dash(invoice.companySnapshot?.gstin)}</td>
                    <td className="px-4 py-3">{formatInr(invoice.totals?.grandTotal)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm" href={`/admin/invoices/${invoice._id}`} onClick={(event) => event.stopPropagation()}>
                          <Eye size={16} />
                          View
                        </Link>
                        <button
                          className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            setMessage("");
                            downloadBlob(`/api/admin/invoices/${invoice._id}/download`, `${invoice.invoiceNumber}.pdf`).catch((error) =>
                              setMessage(error instanceof Error ? error.message : "Download failed"),
                            );
                          }}
                        >
                          <Download size={16} />
                          Download
                        </button>
                      </div>
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
