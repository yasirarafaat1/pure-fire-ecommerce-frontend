"use client";

import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import AdminConfirmDialog from "../components/AdminConfirmDialog";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminPagination from "../components/AdminPagination";
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "../components/AdminStates";
import AdminStatusBadge from "../components/AdminStatusBadge";
import { useAdminList } from "../hooks/useAdminList";
import { AdminApiError, adminApi } from "../lib/adminApi";

type Product = {
  _id: string;
  product_id: number;
  name: string;
  sku?: string;
  product_image?: string[];
  catagory_id?: { name?: string };
  price?: number;
  selling_price?: number;
  quantity?: number;
  status?: string;
  updatedAt?: string;
};

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN");
};

export default function ProductsPage() {
  const list = useAdminList<Product>("/products");
  const [selected, setSelected] = useState<Product | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const updateStatus = async (product: Product) => {
    setMessage("");

    try {
      const form = new FormData();
      form.set("status", product.status === "published" ? "unpublished" : "published");

      await adminApi.patch(`/products/${product.product_id}`, form);
      await list.refresh();
    } catch (error) {
      setMessage(error instanceof AdminApiError ? error.message : "Status update failed");
    }
  };

  const remove = async () => {
    if (!selected) return;

    setBusy(true);

    try {
      await adminApi.delete(`/products/${selected.product_id}`);
      setSelected(null);
      setMessage("Product deleted.");
      await list.refresh();
    } catch (error) {
      setMessage(error instanceof AdminApiError ? error.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-w-0 gap-6">
      <AdminPageHeader
        title="Products"
        description="Search, publish, edit, and manage the live product catalog."
        action={
          <Link
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium !text-white shadow-sm hover:bg-slate-800"
            href="/admin/products/new"
          >
            <Plus size={16} />
            Add product
          </Link>
        }
      />

      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex min-w-0 flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center">
          <input
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            placeholder="Search name, SKU, or product ID"
            value={String(list.filters.q || "")}
            onChange={(event) => list.updateFilters({ q: event.target.value })}
          />

          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 md:w-48"
            value={String(list.filters.status || "")}
            onChange={(event) => list.updateFilters({ status: event.target.value })}
          >
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {message && (
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
            {message}
          </div>
        )}

        {list.loading ? (
          <AdminLoadingState />
        ) : list.error ? (
          <AdminErrorState message={list.error} retry={list.refresh} />
        ) : !list.items.length ? (
          <AdminEmptyState title="No products found" description="Create a product or change your filters." />
        ) : (
          <div className="min-w-0 max-w-full overflow-x-auto">
            <table className="w-full min-w-[1180px] table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[320px]" />
                <col className="w-[150px]" />
                <col className="w-[180px]" />
                <col className="w-[130px]" />
                <col className="w-[90px]" />
                <col className="w-[130px]" />
                <col className="w-[120px]" />
                <col className="w-[220px]" />
              </colgroup>

              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {["Product", "SKU", "Category", "Price", "Stock", "Status", "Updated", "Actions"].map(
                    (label) => (
                      <th className="whitespace-nowrap px-4 py-3 font-semibold" key={label}>
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {list.items.map((product) => (
                  <tr className="bg-white hover:bg-slate-50" key={product._id}>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex min-w-0 items-center gap-3">
                        {product.product_image?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            className="h-11 w-11 shrink-0 rounded-lg border border-slate-100 object-cover"
                            src={product.product_image[0]}
                            alt=""
                          />
                        ) : (
                          <div className="h-11 w-11 shrink-0 rounded-lg border border-slate-100 bg-slate-100" />
                        )}

                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-950" title={product.name}>
                            {product.name || "Untitled product"}
                          </p>
                          <p className="text-xs text-slate-500">#{product.product_id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 align-middle">
                      <span className="block truncate text-slate-700" title={product.sku || "—"}>
                        {product.sku || "—"}
                      </span>
                    </td>

                    <td className="px-4 py-3 align-middle">
                      <span className="block truncate text-slate-700" title={product.catagory_id?.name || "—"}>
                        {product.catagory_id?.name || "—"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 align-middle font-medium text-slate-900">
                      {money.format(product.selling_price || product.price || 0)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 align-middle text-slate-700">
                      {product.quantity || 0}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 align-middle">
                      <AdminStatusBadge status={product.status} />
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 align-middle text-slate-700">
                      {formatDate(product.updatedAt)}
                    </td>

                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <Link
                          aria-label="Edit product"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
                          href={`/admin/products/${product.product_id}/edit`}
                        >
                          <Pencil size={15} />
                        </Link>

                        <button
                          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100"
                          onClick={() => updateStatus(product)}
                        >
                          {product.status === "published" ? "Unpublish" : "Publish"}
                        </button>

                        <button
                          aria-label="Delete product"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => setSelected(product)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-slate-200">
          <AdminPagination pagination={list.pagination} onPage={list.setPage} onLimit={list.setLimit} />
        </div>
      </section>

      <AdminConfirmDialog
        open={Boolean(selected)}
        title="Delete product?"
        description={`This permanently removes ${selected?.name || "this product"} and its stored media references.`}
        confirmLabel="Delete product"
        busy={busy}
        onClose={() => setSelected(null)}
        onConfirm={remove}
      />
    </div>
  );
}