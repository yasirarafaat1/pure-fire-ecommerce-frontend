"use client";

import { FormEvent, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
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

type CategoryForm = {
  name: string;
  slug: string;
  parentId: string;
  description: string;
  status: string;
  sortOrder: string;
};

const blankForm: CategoryForm = {
  name: "",
  slug: "",
  parentId: "",
  description: "",
  status: "ACTIVE",
  sortOrder: "0",
};

const categoryLevel = (category: Category) => category.ancestors?.length || 0;

const categoryPath = (category: Category) => {
  const ancestors = category.ancestors?.map((item) => item.name).filter(Boolean) || [];
  return [...ancestors, category.name].join(" / ");
};

const canUseAsParent = (category: Category, editing: Category | null) => {
  if (categoryLevel(category) >= 2) return false;
  if (!editing) return true;
  if (category._id === editing._id) return false;

  const isChildOfEditing = category.ancestors?.some((ancestor) => ancestor._id === editing._id);
  return !isChildOfEditing;
};

export default function CategoriesPage() {
  const list = useAdminList<Category>("/categories", { limit: 50 });

  const [form, setForm] = useState<CategoryForm>(blankForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const parentOptions = useMemo(
    () => list.items.filter((category) => canUseAsParent(category, editing)),
    [list.items, editing],
  );

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditing(null);
    setForm(blankForm);
    setFormError("");
  };

  const openCreateModal = () => {
    setMessage("");
    setFormError("");
    setEditing(null);
    setForm(blankForm);
    setModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setMessage("");
    setFormError("");
    setEditing(category);
    setForm({
      name: category.name || "",
      slug: category.slug || "",
      parentId: category.parent?._id || "",
      description: category.description || "",
      status: category.status || "ACTIVE",
      sortOrder: String(category.sortOrder ?? 0),
    });
    setModalOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setFormError("");

    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        parentId: form.parentId || "",
        description: form.description.trim(),
        status: form.status,
        sortOrder: Number(form.sortOrder) || 0,
      };

      if (!payload.name) {
        setFormError("Category name is required.");
        return;
      }

      if (editing) {
        await adminApi.patch(`/categories/${editing._id}`, payload);
        setMessage("Category updated.");
      } else {
        await adminApi.post("/categories", payload);
        setMessage("Category created.");
      }

      setModalOpen(false);
      setEditing(null);
      setForm(blankForm);
      await list.refresh();
    } catch (error) {
      setFormError(error instanceof AdminApiError ? error.message : "Category save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;

    setSaving(true);
    setMessage("");

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
    <div className="grid min-w-0 gap-6">
      <AdminPageHeader
        title="Categories"
        description="Manage the storefront three-level category hierarchy."
        action={
          <button
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
            onClick={openCreateModal}
            type="button"
          >
            <Plus size={16} />
            Create category
          </button>
        }
      />

      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex min-w-0 flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              placeholder="Search categories"
              value={String(list.filters.q || "")}
              onChange={(event) => list.updateFilters({ q: event.target.value })}
            />
          </div>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 md:hidden"
            onClick={openCreateModal}
            type="button"
          >
            <Plus size={15} />
            Create
          </button>
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
          <AdminEmptyState title="No categories" description="Create the first category." />
        ) : (
          <div className="min-w-0 max-w-full">
            <table className="w-full min-w-[920px] table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[320px]" />
                <col className="w-[220px]" />
                <col className="w-[110px]" />
                <col className="w-[110px]" />
                <col className="w-[120px]" />
                <col className="w-[170px]" />
              </colgroup>

              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {["Category", "Parent / Path", "Level", "Sort", "Actions"].map((label) => (
                    <th className="whitespace-nowrap px-4 py-3 font-semibold" key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {list.items.map((category) => {
                  const level = categoryLevel(category);
                  const path = categoryPath(category);

                  return (
                    <tr className="bg-white hover:bg-slate-50" key={category._id}>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex min-w-0 items-start gap-2">
                          <span className="shrink-0 pt-0.5 text-slate-400">
                            {level > 0 ? "—".repeat(level) : ""}
                          </span>

                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-950" title={category.name}>
                              {category.name || "Untitled category"}
                            </p>
                            <p className="truncate text-xs text-slate-500" title={`/${category.slug || "no-slug"}`}>
                              /{category.slug || "no-slug"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <span className="block truncate text-slate-700" title={path || "Root category"}>
                          {category.parent?.name ? path : "Root category"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 align-middle text-slate-700">
                        {level === 0 ? "Root" : `Level ${level + 1}`}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 align-middle text-slate-700">
                        {category.sortOrder ?? 0}
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <button
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                            onClick={() => openEditModal(category)}
                            type="button"
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-600 hover:bg-red-50"
                            onClick={() => setDeleting(category)}
                            type="button"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-slate-200">
          <AdminPagination pagination={list.pagination} onPage={list.setPage} onLimit={list.setLimit} />
        </div>
      </section>

      <CategoryModal
        open={modalOpen}
        editing={editing}
        form={form}
        formError={formError}
        parentOptions={parentOptions}
        saving={saving}
        onClose={closeModal}
        onChange={setForm}
        onSubmit={submit}
      />

      <AdminConfirmDialog
        open={Boolean(deleting)}
        title="Delete category?"
        description="Categories with products or child categories cannot be deleted."
        confirmLabel="Delete category"
        busy={saving}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
      />
    </div>
  );
}

function CategoryModal({
  open,
  editing,
  form,
  formError,
  parentOptions,
  saving,
  onClose,
  onChange,
  onSubmit,
}: {
  open: boolean;
  editing: Category | null;
  form: CategoryForm;
  formError: string;
  parentOptions: Category[];
  saving: boolean;
  onClose: () => void;
  onChange: (form: CategoryForm) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/50 p-4">
      <button
        aria-label="Close category modal"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />

      <form
        className="relative z-10 grid max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onSubmit={onSubmit}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-slate-950">
              {editing ? "Edit category" : "Create category"}
            </h3>
            <p className="mt-0.5 text-sm text-slate-500">
              {editing
                ? "Update category details and hierarchy."
                : "Create a root category or select a parent category."}
            </p>
          </div>

          <button
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            <X size={17} />
          </button>
        </div>

        <div className="grid max-h-[calc(90vh-140px)] gap-4 overflow-y-auto p-5">
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Name <span className="text-red-600">*</span>
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                value={form.name}
                onChange={(event) => onChange({ ...form, name: event.target.value })}
                placeholder="Category name"
                required
              />
            </label>

            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Slug
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                value={form.slug}
                onChange={(event) => onChange({ ...form, slug: event.target.value })}
                placeholder="category-slug"
              />
            </label>
          </div>

          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Parent category
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              value={form.parentId}
              onChange={(event) => onChange({ ...form, parentId: event.target.value })}
            >
              <option value="">Root category</option>
              {parentOptions.map((category) => (
                <option value={category._id} key={category._id}>
                  {"— ".repeat(categoryLevel(category))}
                  {category.name}
                </option>
              ))}
            </select>
            <span className="text-xs font-normal text-slate-500">
              Root category means this category will not have a parent. Maximum three levels are supported.
            </span>
          </label>

          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Description
            <textarea
              className="min-h-24 resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              value={form.description}
              onChange={(event) => onChange({ ...form, description: event.target.value })}
              placeholder="Short category description"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Status
              <select
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                value={form.status}
                onChange={(event) => onChange({ ...form, status: event.target.value })}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </label>

            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Sort order
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                value={form.sortOrder}
                onChange={(event) => onChange({ ...form, sortOrder: event.target.value })}
                inputMode="numeric"
                placeholder="0"
              />
            </label>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>

          <button
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            disabled={saving}
            type="submit"
          >
            {saving ? "Saving..." : editing ? "Update category" : "Create category"}
          </button>
        </div>
      </form>
    </div>
  );
}