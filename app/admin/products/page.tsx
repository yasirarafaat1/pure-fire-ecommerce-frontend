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

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

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
    <div className="grid gap-6">
      <AdminPageHeader
        title="Products"
        description="Search, publish, edit, and manage the live product catalog."
        action={
          <Link className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium !text-white shadow-sm hover:bg-slate-800" href="/admin/products/new">
            <Plus size={16} /> Add product
          </Link>
        }
      />
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row">
          <input
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            placeholder="Search name, SKU, or product ID"
            value={String(list.filters.q || "")}
            onChange={(event) => list.updateFilters({ q: event.target.value })}
          />
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={String(list.filters.status || "")}
            onChange={(event) => list.updateFilters({ status: event.target.value })}
          >
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        {message && <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm">{message}</div>}
        {list.loading ? <AdminLoadingState /> : list.error ? (
          <AdminErrorState message={list.error} retry={list.refresh} />
        ) : !list.items.length ? (
          <AdminEmptyState title="No products found" description="Create a product or change your filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  {["Product", "SKU", "Category", "Price", "Stock", "Status", "Updated", "Actions"].map((label) => (
                    <th className="px-4 py-3" key={label}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.items.map((product) => (
                  <tr className="border-t border-slate-100" key={product._id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.product_image?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className="h-10 w-10 rounded-lg object-cover" src={product.product_image[0]} alt="" />
                        ) : <div className="h-10 w-10 rounded-lg bg-slate-100" />}
                        <div><p className="font-medium">{product.name}</p><p className="text-xs text-slate-500">#{product.product_id}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{product.sku || "—"}</td>
                    <td className="px-4 py-3">{product.catagory_id?.name || "—"}</td>
                    <td className="px-4 py-3">{money.format(product.selling_price || product.price || 0)}</td>
                    <td className="px-4 py-3">{product.quantity || 0}</td>
                    <td className="px-4 py-3"><AdminStatusBadge status={product.status} /></td>
                    <td className="px-4 py-3">{product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link aria-label="Edit product" className="rounded-lg border border-slate-300 p-2" href={`/admin/products/${product.product_id}/edit`}><Pencil size={15} /></Link>
                        <button className="rounded-lg border border-slate-300 px-2 text-xs" onClick={() => updateStatus(product)}>
                          {product.status === "published" ? "Unpublish" : "Publish"}
                        </button>
                        <button aria-label="Delete product" className="rounded-lg border border-red-200 p-2 text-red-600" onClick={() => setSelected(product)}><Trash2 size={15} /></button>
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
