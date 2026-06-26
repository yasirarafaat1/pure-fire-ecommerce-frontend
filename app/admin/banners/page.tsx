"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  ImageIcon,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import AdminConfirmDialog from "../components/AdminConfirmDialog";
import AdminPageHeader from "../components/AdminPageHeader";
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "../components/AdminStates";
import { AdminApiError, adminApi } from "../lib/adminApi";

type Banner = {
  _id: string;
  title?: string;
  imageUrl: string;
  targetUrl: string;
  width?: number;
  height?: number;
  order?: number;
  isActive?: boolean;
};

type BannerForm = {
  title: string;
  imageUrl: string;
  imageFile: File | null;
  targetUrl: string;
  order: string;
  isActive: boolean;
};

const blankForm: BannerForm = {
  title: "",
  imageUrl: "",
  imageFile: null,
  targetUrl: "",
  order: "0",
  isActive: true,
};

const isValidUrl = (value: string) => /^https?:\/\/.+/i.test(value.trim());

const filePreviewUrl = (file: File | null) => {
  if (!file) return "";
  return URL.createObjectURL(file);
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [deleting, setDeleting] = useState<Banner | null>(null);

  const [form, setForm] = useState<BannerForm>(blankForm);
  const [formError, setFormError] = useState("");

  const [previewUrl, setPreviewUrl] = useState("");

  const fetchBanners = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await adminApi.get<{ banners: Banner[] }>("/banners");
      setBanners(data.banners || []);
    } catch (requestError) {
      setError(requestError instanceof AdminApiError ? requestError.message : "Unable to load banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchBanners();
  }, []);

  useEffect(() => {
    if (!form.imageFile) {
      setPreviewUrl(form.imageUrl || editing?.imageUrl || "");
      return;
    }

    const url = filePreviewUrl(form.imageFile);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [form.imageFile, form.imageUrl, editing?.imageUrl]);

  const filteredBanners = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return banners
      .filter((banner) => {
        if (statusFilter === "active") return Boolean(banner.isActive);
        if (statusFilter === "inactive") return !banner.isActive;
        return true;
      })
      .filter((banner) => {
        if (!normalizedQuery) return true;

        return [banner.title, banner.targetUrl, banner.imageUrl]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));
      })
      .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  }, [banners, query, statusFilter]);

  const activeCount = banners.filter((banner) => banner.isActive).length;
  const inactiveCount = banners.length - activeCount;

  const openCreateModal = () => {
    setMessage("");
    setFormError("");
    setEditing(null);
    setForm(blankForm);
    setPreviewUrl("");
    setModalOpen(true);
  };

  const openEditModal = (banner: Banner) => {
    setMessage("");
    setFormError("");
    setEditing(banner);
    setForm({
      title: banner.title || "",
      imageUrl: banner.imageUrl || "",
      imageFile: null,
      targetUrl: banner.targetUrl || "",
      order: String(banner.order ?? 0),
      isActive: Boolean(banner.isActive),
    });
    setPreviewUrl(banner.imageUrl || "");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditing(null);
    setForm(blankForm);
    setFormError("");
    setPreviewUrl("");
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({
      ...current,
      imageFile: event.target.files?.[0] || null,
    }));
  };

  const validateForm = () => {
    const imageUrl = form.imageUrl.trim();
    const targetUrl = form.targetUrl.trim();

    if (!editing && !form.imageFile && !imageUrl) {
      return "Upload an image or provide an image URL.";
    }

    if (imageUrl && !isValidUrl(imageUrl)) {
      return "Image URL must be a valid http/https URL.";
    }

    if (!targetUrl) {
      return "Target URL is required.";
    }

    if (!isValidUrl(targetUrl)) {
      return "Target URL must be a valid http/https URL.";
    }

    return "";
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    setMessage("");
    setFormError("");

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);

    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("targetUrl", form.targetUrl.trim());
      fd.append("order", String(Number(form.order) || 0));
      fd.append("isActive", String(form.isActive));

      if (form.imageUrl.trim()) {
        fd.append("imageUrl", form.imageUrl.trim());
      }

      if (form.imageFile) {
        fd.append("image", form.imageFile);
      }

      if (editing) {
        await adminApi.patch(`/banners/${editing._id}`, fd);
        setMessage("Banner updated.");
      } else {
        await adminApi.post("/banners", fd);
        setMessage("Banner created.");
      }

      closeModal();
      await fetchBanners();
    } catch (requestError) {
      setFormError(requestError instanceof AdminApiError ? requestError.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (banner: Banner) => {
    setMessage("");

    try {
      await adminApi.patch(`/banners/${banner._id}`, { isActive: !banner.isActive });
      setMessage(banner.isActive ? "Banner deactivated." : "Banner activated.");
      await fetchBanners();
    } catch (requestError) {
      setMessage(requestError instanceof AdminApiError ? requestError.message : "Status update failed");
    }
  };

  const remove = async () => {
    if (!deleting) return;

    setSaving(true);
    setMessage("");

    try {
      await adminApi.delete(`/banners/${deleting._id}`);
      setDeleting(null);
      setMessage("Banner deleted.");
      await fetchBanners();
    } catch (requestError) {
      setMessage(requestError instanceof AdminApiError ? requestError.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid min-w-0 gap-6">
      <AdminPageHeader
        title="Banner Carousel"
        description="Manage storefront banner slides, target links, display order, and active status."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
              disabled={loading}
              onClick={() => void fetchBanners()}
              type="button"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
              onClick={openCreateModal}
              type="button"
            >
              <Plus size={16} />
              Add banner
            </button>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Total Banners" value={banners.length} />
        <SummaryCard label="Active" value={activeCount} />
        <SummaryCard label="Inactive" value={inactiveCount} />
      </section>

      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-200 p-4 lg:grid-cols-[minmax(0,1fr)_180px]">
          <div className="relative min-w-0">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-900"
              placeholder="Search title, target URL, or image URL"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>

        {message && (
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
            {message}
          </div>
        )}

        {loading ? (
          <AdminLoadingState />
        ) : error ? (
          <AdminErrorState message={error} retry={fetchBanners} />
        ) : !filteredBanners.length ? (
          <AdminEmptyState
            title="No banners found"
            description={banners.length ? "Change your filters or search query." : "Create your first storefront banner."}
          />
        ) : (
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredBanners.map((banner) => (
              <BannerCard
                banner={banner}
                key={banner._id}
                onDelete={() => setDeleting(banner)}
                onEdit={() => openEditModal(banner)}
                onToggle={() => void toggleActive(banner)}
              />
            ))}
          </div>
        )}
      </section>

      <BannerModal
        editing={editing}
        form={form}
        formError={formError}
        open={modalOpen}
        previewUrl={previewUrl}
        saving={saving}
        onChange={setForm}
        onClose={closeModal}
        onFileChange={onFileChange}
        onSubmit={submit}
      />

      <AdminConfirmDialog
        open={Boolean(deleting)}
        title="Delete banner?"
        description={`This will permanently delete ${deleting?.title || "this banner"}.`}
        confirmLabel="Delete banner"
        busy={saving}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
      />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function BannerCard({
  banner,
  onDelete,
  onEdit,
  onToggle,
}: {
  banner: Banner;
  onDelete: () => void;
  onEdit: () => void;
  onToggle: () => void;
}) {
  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
        {banner.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={banner.imageUrl}
            alt={banner.title || "Banner"}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="grid h-full place-items-center text-slate-400">
            <ImageIcon size={28} />
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              banner.isActive ? "bg-emerald-600 text-white" : "bg-slate-800 text-white"
            }`}
          >
            {banner.isActive ? "Active" : "Inactive"}
          </span>

          <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm">
            Order {banner.order ?? 0}
          </span>
        </div>
      </div>

      <div className="grid gap-3 p-4">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-slate-950" title={banner.title || "Untitled banner"}>
            {banner.title || "Untitled banner"}
          </h3>

          <a
            className="mt-1 flex min-w-0 items-center gap-1 text-sm text-slate-500 hover:text-slate-950"
            href={banner.targetUrl}
            rel="noreferrer"
            target="_blank"
            title={banner.targetUrl}
          >
            <span className="truncate">{banner.targetUrl}</span>
            <ExternalLink size={13} className="shrink-0" />
          </a>

          <p className="mt-2 text-xs text-slate-500">
            Size: {banner.width || "?"}×{banner.height || "?"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={onEdit}
            type="button"
          >
            <Pencil size={14} />
            Edit
          </button>

          <button
            className="inline-flex h-9 items-center rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={onToggle}
            type="button"
          >
            {banner.isActive ? "Deactivate" : "Activate"}
          </button>

          <button
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-600 hover:bg-red-50"
            onClick={onDelete}
            type="button"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

function BannerModal({
  editing,
  form,
  formError,
  open,
  previewUrl,
  saving,
  onChange,
  onClose,
  onFileChange,
  onSubmit,
}: {
  editing: Banner | null;
  form: BannerForm;
  formError: string;
  open: boolean;
  previewUrl: string;
  saving: boolean;
  onChange: (form: BannerForm) => void;
  onClose: () => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/50 p-4">
      <button
        aria-label="Close banner modal"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />

      <form
        className="relative z-10 grid max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onSubmit={onSubmit}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-slate-950">
              {editing ? "Edit banner" : "Create banner"}
            </h3>
            <p className="mt-0.5 text-sm text-slate-500">
              Upload a 16:9 landscape banner and connect it to a target URL.
            </p>
          </div>

          <button
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            <X size={17} />
          </button>
        </div>

        <div className="grid max-h-[calc(92vh-140px)] gap-5 overflow-y-auto p-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="grid gap-4">
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </div>
            )}

            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Title
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                placeholder="Summer sale banner"
                value={form.title}
                onChange={(event) => onChange({ ...form, title: event.target.value })}
              />
            </label>

            <label className="grid gap-1.5 flex items-center text-sm font-medium text-slate-700">
              Target URL *
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                placeholder="https://example.com/collection"
                value={form.targetUrl}
                onChange={(event) => onChange({ ...form, targetUrl: event.target.value })}
              />
            </label>

            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Image URL
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                placeholder="https://example.com/banner.jpg"
                value={form.imageUrl}
                onChange={(event) =>
                  onChange({
                    ...form,
                    imageUrl: event.target.value,
                    imageFile: null,
                  })
                }
              />
            </label>

            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Upload Image
              <input
                accept="image/*"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-950 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
                onChange={onFileChange}
                type="file"
              />
              <span className="text-xs font-normal text-slate-500">
                Recommended size: 1200×675 or any 16:9 landscape image.
              </span>
            </label>

            <div className="flex flex-wrap items-end gap-3">
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Display order
                <input
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                  inputMode="numeric"
                  placeholder="0"
                  value={form.order}
                  onChange={(event) => onChange({ ...form, order: event.target.value })}
                />
              </label>

              <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
                <input
                  checked={form.isActive}
                  className="h-4 w-4 rounded border-slate-300"
                  onChange={(event) => onChange({ ...form, isActive: event.target.checked })}
                  type="checkbox"
                />
                Active banner
              </label>
            </div>
          </div>

          <div className="lg:sticky top-4 grid h-fit gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-700">Preview</p>

            <div className="aspect-[16/9] overflow-hidden rounded-lg border border-slate-200 bg-white">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Banner preview" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-slate-400">
                  <div className="grid justify-items-center gap-2 text-sm">
                    <ImageIcon size={28} />
                    No image selected
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-1 text-xs text-slate-500">
              <p className="truncate" title={form.title || "Untitled banner"}>
                Title: {form.title || "Untitled banner"}
              </p>
              <p className="truncate" title={form.targetUrl || "No target URL"}>
                Target: {form.targetUrl || "No target URL"}
              </p>
              <p>Status: {form.isActive ? "Active" : "Inactive"}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            Close
          </button>

          <button
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            disabled={saving}
            type="submit"
          >
            {saving ? "Saving..." : editing ? "Update banner" : "Save banner"}
          </button>
        </div>
      </form>
    </div>
  );
}