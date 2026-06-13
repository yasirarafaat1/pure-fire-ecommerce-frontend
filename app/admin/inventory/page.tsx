"use client";

import { useState } from "react";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminPagination from "../components/AdminPagination";
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "../components/AdminStates";
import AdminStatusBadge from "../components/AdminStatusBadge";
import { useAdminList } from "../hooks/useAdminList";
import { AdminApiError, adminApi } from "../lib/adminApi";

type InventoryItem = {
  _id: string;
  product_id: number;
  name: string;
  sku?: string;
  quantity: number;
  lowStockThreshold?: number;
  status?: string;
  catagory_id?: { name?: string };
};

export default function InventoryPage() {
  const list = useAdminList<InventoryItem>("/products/inventory");
  const [message, setMessage] = useState("");

  const update = async (item: InventoryItem, quantity: number) => {
    setMessage("");
    try {
      await adminApi.patch(`/products/${item.product_id}/inventory`, {
        quantity,
        lowStockThreshold: item.lowStockThreshold || 5,
      });
      setMessage(`${item.name} stock updated.`);
      await list.refresh();
    } catch (error) {
      setMessage(error instanceof AdminApiError ? error.message : "Stock update failed");
    }
  };

  return (
    <div className="grid gap-6">
      <AdminPageHeader title="Inventory" description="Monitor and safely update current product stock levels." />
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row">
          <input className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Search product or SKU" value={String(list.filters.q || "")} onChange={(event) => list.updateFilters({ q: event.target.value })} />
          <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={String(list.filters.stock || "")} onChange={(event) => list.updateFilters({ stock: event.target.value })}>
            <option value="">All stock</option><option value="low">Low stock</option><option value="out">Out of stock</option>
          </select>
        </div>
        {message && <p className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm">{message}</p>}
        {list.loading ? <AdminLoadingState /> : list.error ? <AdminErrorState message={list.error} retry={list.refresh} /> : !list.items.length ? <AdminEmptyState title="No inventory items" description="Change your search or stock filter." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{["Product", "SKU", "Category", "Stock", "Threshold", "Status", "Update"].map((label) => <th className="px-4 py-3" key={label}>{label}</th>)}</tr></thead>
              <tbody>{list.items.map((item) => (
                <InventoryRow item={item} update={update} key={item._id} />
              ))}</tbody>
            </table>
          </div>
        )}
        <AdminPagination pagination={list.pagination} onPage={list.setPage} onLimit={list.setLimit} />
      </section>
    </div>
  );
}

function InventoryRow({ item, update }: { item: InventoryItem; update: (item: InventoryItem, quantity: number) => void }) {
  const [quantity, setQuantity] = useState(String(item.quantity || 0));
  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-3 font-medium">{item.name}</td><td className="px-4 py-3">{item.sku || "—"}</td>
      <td className="px-4 py-3">{item.catagory_id?.name || "—"}</td>
      <td className="px-4 py-3"><input aria-label={`Stock for ${item.name}`} className="w-24 rounded-lg border border-slate-300 px-2 py-1.5" min="0" type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></td>
      <td className="px-4 py-3">{item.lowStockThreshold || 5}</td><td className="px-4 py-3"><AdminStatusBadge status={item.quantity <= 0 ? "OUT OF STOCK" : item.quantity <= (item.lowStockThreshold || 5) ? "LOW STOCK" : "ACTIVE"} /></td>
      <td className="px-4 py-3"><button className="rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-medium text-white" onClick={() => update(item, Math.max(0, Number(quantity) || 0))}>Save</button></td>
    </tr>
  );
}
