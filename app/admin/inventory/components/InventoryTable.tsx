"use client";

import { useEffect, useState } from "react";
import ProductWizard from "../../upload-product/components/ProductWizard";

const API_BASE = "/api/admin";

const IconEdit = ({ className = "" }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
  </svg>
);

const IconTrash = ({ className = "" }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18" />
    <path d="M19 6 18 20H6L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export default function InventoryTable() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [tab, setTab] = useState<"published" | "unpublished">("published");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"id" | "name" | "price" | "stock" | "status">("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const fetchProducts = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/get-products`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error("Failed to fetch products");
      setProducts(data.products || []);
    } catch (err: any) {
      setMessage("Could not load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const visibleProducts = products
    .filter((p) => (tab === "published" ? p.status === "published" || !p.status : p.status === "unpublished"))
    .filter((p) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        String(p.product_id).includes(q) ||
        (p.name || p.title || "").toLowerCase().includes(q) ||
        (p.catagory_id?.name || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const getVal = (p: any) => {
        switch (sortKey) {
          case "id":
            return Number(p.product_id) || 0;
          case "name":
            return (p.name || p.title || "").toLowerCase();
          case "price":
            return Number(p.selling_price ?? p.price ?? 0);
          case "stock":
            return Number(p.quantity ?? 0);
          case "status":
            return (p.status || "").toLowerCase();
          default:
            return 0;
        }
      };
      const va = getVal(a);
      const vb = getVal(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });

  const deleteProduct = async (productId: number) => {
    setMessage("");
    setDeletingId(productId);
    try {
      const res = await fetch(`${API_BASE}/delete-product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Delete failed");
      setMessage("Product deleted.");
      fetchProducts();
    } catch (err: any) {
      setMessage("Failed to delete product. Please retry.");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleStatus = async (productId: number, nextStatus: "published" | "unpublished") => {
    setTogglingId(productId);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/update-product/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error("Status update failed");
      await fetchProducts();
    } catch (err) {
      setMessage("Could not update status. Please retry.");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="grid gap-6">
      <header className="flex items-center justify-between">
        <div>
          {/* <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">Inventory</p> */}
          <h1 className="text-2xl font-semibold">Inventory</h1>
        </div>
      </header>

      {showWizard && editing && (
        <ProductWizard
          product={editing}
          onSaved={() => {
            setShowWizard(false);
            setEditing(null);
            fetchProducts();
          }}
          onClose={() => {
            setShowWizard(false);
            setEditing(null);
          }}
        />
      )}

      {!showWizard && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-4">
            <button
              className={`btn ${tab === "published" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setTab("published")}
              disabled={loading}
            >
              Published
            </button>
            <button
              className={`btn ${tab === "unpublished" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setTab("unpublished")}
              disabled={loading}
            >
              Unpublished
            </button>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-[var(--muted)] ml-auto">
                <span className="spinner" />
                <span>Loading…</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3 items-center mb-3">
            <input
              className="input max-w-xs"
              placeholder="Search by id, name, category"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex items-center gap-2 text-sm">
              <span className="label m-0">Sort by</span>
              <select
                className="input !w-auto"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as any)}
              >
                <option value="id">ID</option>
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="stock">Stock</option>
                <option value="status">Status</option>
              </select>
              <button
                className="btn btn-ghost"
                onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
              >
                {sortDir === "asc" ? "↑ Asc" : "↓ Desc"}
              </button>
            </div>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[var(--muted)]">
                <tr>
                  <th className="py-2">ID</th>
                  <th className="py-2">Name</th>
                  <th className="py-2">Category</th>
                  <th className="py-2">Price</th>
                  <th className="py-2">Stock</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleProducts.map((p) => (
                  <tr key={p.product_id} className="border-t border-black/5">
                      <td className="py-2">{p.product_id}</td>
                      <td className="py-2">{p.name || p.title}</td>
                      <td className="py-2">{p.catagory_id?.name || "-"}</td>
                      <td className="py-2">₹{p.selling_price ?? p.price ?? "-"}</td>
                      <td className="py-2">{p.quantity ?? "-"}</td>
                      <td className="py-2">{p.status || tab}</td>
                      <td className="py-2 space-x-2">
                        <button
                          className="btn btn-ghost"
                          onClick={() => {
                            setEditing(p);
                            setShowWizard(true);
                          }}
                          disabled={deletingId === p.product_id || togglingId === p.product_id}
                        >
                          <IconEdit /> Edit
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() => setConfirmDelete(p)}
                          disabled={deletingId === p.product_id || togglingId === p.product_id}
                        >
                          <IconTrash /> Delete
                        </button>
                        {tab === "published" ? (
                          <button
                            className="btn btn-primary"
                            onClick={() => toggleStatus(p.product_id, "unpublished")}
                            disabled={togglingId === p.product_id}
                          >
                            {togglingId === p.product_id ? (
                              <span className="flex items-center gap-1">
                                <span className="spinner" /> Unpublishing…
                              </span>
                            ) : (
                              "Unpublish"
                            )}
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary"
                            onClick={() => toggleStatus(p.product_id, "published")}
                            disabled={togglingId === p.product_id}
                          >
                            {togglingId === p.product_id ? (
                              <span className="flex items-center gap-1">
                                <span className="spinner" /> Publishing…
                              </span>
                            ) : (
                              "Publish"
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                {visibleProducts.length === 0 && (
                  <tr>
                    <td className="py-4 text-[var(--muted)]" colSpan={7}>
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {message && <p className="mt-3 text-sm text-[var(--muted)]">{message}</p>}
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur flex items-center justify-center z-50">
          <div className="card p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Delete product?</h3>
            <p className="text-sm text-[var(--muted)]">This will remove product #{confirmDelete.product_id}.</p>
            <div className="mt-4 flex flex-wrap gap-2 justify-end">
              <button
                className="btn btn-ghost"
                onClick={() => setConfirmDelete(null)}
                disabled={deletingId !== null}
              >
                ✖ No
              </button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  await deleteProduct(confirmDelete.product_id);
                  setConfirmDelete(null);
                }}
                disabled={deletingId !== null}
              >
                {deletingId === confirmDelete?.product_id ? (
                  <span className="flex items-center gap-2"><span className="spinner" /> Deleting…</span>
                ) : (
                  <>
                    <IconTrash /> Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
