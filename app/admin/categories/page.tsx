"use client";

import { FormEvent, useState } from "react";
import AdminConfirmDialog from "../components/AdminConfirmDialog";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminPagination from "../components/AdminPagination";
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "../components/AdminStates";
import AdminStatusBadge from "../components/AdminStatusBadge";
import { useAdminList } from "../hooks/useAdminList";
import { AdminApiError, adminApi } from "../lib/adminApi";

type Category = {
  _id: string;
  name: string;
  slug?: string;
  parent?: { _id: string; name: string } | null;
  ancestors?: Array<{ _id: string; name: string }>;
  description?: string;
  status?: string;
  sortOrder?: number;
};

const blank = { name: "", slug: "", parentId: "", description: "", status: "ACTIVE", sortOrder: "0" };

export default function CategoriesPage() {
  const list = useAdminList<Category>("/categories", { limit: 50 });
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const payload = { ...form, sortOrder: Number(form.sortOrder) || 0 };
      if (editing) await adminApi.patch(`/categories/${editing._id}`, payload);
      else await adminApi.post("/categories", payload);
      setForm(blank);
      setEditing(null);
      setMessage(editing ? "Category updated." : "Category created.");
      await list.refresh();
    } catch (error) {
      setMessage(error instanceof AdminApiError ? error.message : "Category save failed");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (category: Category) => {
    setEditing(category);
    setForm({
      name: category.name,
      slug: category.slug || "",
      parentId: category.parent?._id || "",
      description: category.description || "",
      status: category.status || "ACTIVE",
      sortOrder: String(category.sortOrder || 0),
    });
  };

  const remove = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      await adminApi.delete(`/categories/${deleting._id}`);
      setDeleting(null);
      setMessage("Category deleted.");
      await list.refresh();
    } catch (error) {
      setMessage(error instanceof AdminApiError ? error.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6">
      <AdminPageHeader title="Categories" description="Manage the storefront three-level category hierarchy." />
      <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={submit}>
          <h3 className="font-semibold">{editing ? "Edit category" : "Create category"}</h3>
          <div className="mt-4 grid gap-3">
            {[
              ["name", "Name"],
              ["slug", "Slug"],
              ["description", "Description"],
              ["sortOrder", "Sort order"],
            ].map(([key, label]) => (
              <label className="grid gap-1.5 text-sm font-medium" key={key}>
                {label}
                <input
                  className="rounded-lg border border-slate-300 px-3 py-2"
                  value={form[key as keyof typeof form]}
                  onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                  required={key === "name"}
                />
              </label>
            ))}
            {!editing && (
              <label className="grid gap-1.5 text-sm font-medium">
                Parent
                <select className="rounded-lg border border-slate-300 px-3 py-2" value={form.parentId} onChange={(event) => setForm({ ...form, parentId: event.target.value })}>
                  <option value="">Root category</option>
                  {list.items.filter((item) => (item.ancestors?.length || 0) < 2).map((item) => (
                    <option value={item._id} key={item._id}>
                      {"— ".repeat(item.ancestors?.length || 0)}{item.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="grid gap-1.5 text-sm font-medium">
              Status
              <select className="rounded-lg border border-slate-300 px-3 py-2" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </label>
            <div className="flex gap-2">
              <button className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60" disabled={saving}>
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </button>
              {editing && <button type="button" className="rounded-lg border border-slate-300 px-4 py-2 text-sm" onClick={() => { setEditing(null); setForm(blank); }}>Cancel</button>}
            </div>
            {message && <p className="text-sm text-slate-600">{message}</p>}
          </div>
        </form>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Search categories" value={String(list.filters.q || "")} onChange={(event) => list.updateFilters({ q: event.target.value })} />
          </div>
          {list.loading ? <AdminLoadingState /> : list.error ? <AdminErrorState message={list.error} retry={list.refresh} /> : !list.items.length ? <AdminEmptyState title="No categories" description="Create the first category." /> : (
            <div className="divide-y divide-slate-100">
              {list.items.map((category) => (
                <div className="flex items-center gap-4 px-4 py-3" key={category._id}>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{"— ".repeat(category.ancestors?.length || 0)}{category.name}</p>
                    <p className="truncate text-xs text-slate-500">/{category.slug || "no-slug"}</p>
                  </div>
                  <AdminStatusBadge status={category.status} />
                  <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm" onClick={() => startEdit(category)}>Edit</button>
                  <button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600" onClick={() => setDeleting(category)}>Delete</button>
                </div>
              ))}
            </div>
          )}
          <AdminPagination pagination={list.pagination} onPage={list.setPage} onLimit={list.setLimit} />
        </div>
      </section>
      <AdminConfirmDialog open={Boolean(deleting)} title="Delete category?" description="Categories with products or child categories cannot be deleted." confirmLabel="Delete category" busy={saving} onClose={() => setDeleting(null)} onConfirm={remove} />
    </div>
  );
}
