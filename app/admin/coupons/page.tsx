"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Clock3, Plus, RefreshCw, Tags, X } from "lucide-react";
import AdminConfirmDialog from "../components/AdminConfirmDialog";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminPagination from "../components/AdminPagination";
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "../components/AdminStates";
import AdminStatusBadge from "../components/AdminStatusBadge";
import { useAdminList } from "../hooks/useAdminList";
import { AdminApiError, adminApi } from "../lib/adminApi";

type TargetScope = "ALL_PRODUCTS" | "SELECTED_PRODUCTS" | "SELECTED_CATEGORIES";
type TimerType = "FIXED_WINDOW" | "ONE_TIME" | "LOOP";

type PromoTimer = {
  enabled: boolean;
  type: TimerType;
  startAt?: string | null;
  endAt?: string | null;
  durationMinutes?: number;
};

type PromoTarget = {
  scope: TargetScope;
  productIds: number[];
  categoryIds: string[];
};

type Coupon = {
  _id: string;
  code: string;
  description?: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minimumOrderAmount: number;
  maxDiscountAmount: number;
  usageLimit: number;
  perCustomerLimit: number;
  usedCount: number;
  startsAt?: string | null;
  endsAt?: string | null;
  target?: PromoTarget;
  timer?: PromoTimer;
  status: "ACTIVE" | "DISABLED";
};

type ProductOption = {
  _id: string;
  product_id: number;
  name: string;
  title?: string;
  status?: string;
};

type CategoryOption = {
  _id: string;
  name: string;
  ancestors?: Array<{ _id: string; name: string }>;
  status?: string;
};

type PromoForm = {
  code: string;
  description: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: string;
  minimumOrderAmount: string;
  maxDiscountAmount: string;
  usageLimit: string;
  perCustomerLimit: string;
  startsAt: string;
  endsAt: string;
  status: "ACTIVE" | "DISABLED";
  target: {
    scope: TargetScope;
    productIds: number[];
    categoryIds: string[];
  };
  timer: {
    enabled: boolean;
    type: TimerType;
    startAt: string;
    endAt: string;
    durationMinutes: string;
  };
};

const blank: PromoForm = {
  code: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  minimumOrderAmount: "0",
  maxDiscountAmount: "0",
  usageLimit: "0",
  perCustomerLimit: "0",
  startsAt: "",
  endsAt: "",
  status: "ACTIVE",
  target: {
    scope: "ALL_PRODUCTS",
    productIds: [],
    categoryIds: [],
  },
  timer: {
    enabled: false,
    type: "FIXED_WINDOW",
    startAt: "",
    endAt: "",
    durationMinutes: "60",
  },
};

const toDateInput = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const toDateTimeInput = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const categoryLabel = (category: CategoryOption) => {
  const parents = (category.ancestors || []).map((item) => item.name).filter(Boolean);
  return [...parents, category.name].join(" / ");
};

const targetLabel = (target?: PromoTarget) => {
  if (!target || target.scope === "ALL_PRODUCTS") return "All products";
  if (target.scope === "SELECTED_PRODUCTS") return `${target.productIds?.length || 0} selected product(s)`;
  return `${target.categoryIds?.length || 0} selected category(s)`;
};

const timerLabel = (timer?: PromoTimer) => {
  if (!timer?.enabled) return "No timer";
  if (timer.type === "FIXED_WINDOW") return "Fixed window";
  if (timer.type === "ONE_TIME") return "One time";
  return "Loop";
};

const descriptionWordCount = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;

export default function CouponsPage() {
  const list = useAdminList<Coupon>("/coupons");
  const [form, setForm] = useState<PromoForm>(blank);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState<Coupon | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOptions = useCallback(async () => {
    setOptionsLoading(true);
    try {
      const [productResponse, categoryResponse] = await Promise.all([
        adminApi.get<{ data: ProductOption[] }>("/products?limit=100"),
        adminApi.get<{ data: CategoryOption[] }>("/categories?limit=200"),
      ]);

      setProducts(productResponse.data || []);
      setCategories(categoryResponse.data || []);
    } catch {
      setMessage("Promo options could not be loaded. Product/category targeting may be unavailable.");
    } finally {
      setOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  const selectedProducts = useMemo(
    () => products.filter((product) => form.target.productIds.includes(product.product_id)),
    [form.target.productIds, products],
  );

  const selectedCategories = useMemo(
    () => categories.filter((category) => form.target.categoryIds.includes(category._id)),
    [categories, form.target.categoryIds],
  );

  const resetEditor = () => {
    setEditing(null);
    setForm(blank);
    setEditorOpen(false);
  };

  const openCreate = () => {
    setMessage("");
    setEditing(null);
    setForm(blank);
    setEditorOpen(true);
  };

  const edit = (coupon: Coupon) => {
    setMessage("");
    setEditing(coupon);
    setForm({
      ...blank,
      code: coupon.code,
      description: coupon.description || "",
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minimumOrderAmount: String(coupon.minimumOrderAmount || 0),
      maxDiscountAmount: String(coupon.maxDiscountAmount || 0),
      usageLimit: String(coupon.usageLimit || 0),
      perCustomerLimit: String(coupon.perCustomerLimit || 0),
      startsAt: toDateInput(coupon.startsAt),
      endsAt: toDateInput(coupon.endsAt),
      status: coupon.status,
      target: {
        scope: coupon.target?.scope || "ALL_PRODUCTS",
        productIds: coupon.target?.productIds || [],
        categoryIds: coupon.target?.categoryIds || [],
      },
      timer: {
        enabled: Boolean(coupon.timer?.enabled),
        type: coupon.timer?.type || "FIXED_WINDOW",
        startAt: toDateTimeInput(coupon.timer?.startAt),
        endAt: toDateTimeInput(coupon.timer?.endAt),
        durationMinutes: String(coupon.timer?.durationMinutes || 60),
      },
    });
    setEditorOpen(true);
  };

  const validateForm = () => {
    const words = descriptionWordCount(form.description);
    if (!form.code.trim()) return "Promo code is required.";
    if (!/^[A-Z0-9_-]{3,30}$/.test(form.code.trim())) {
      return "Promo code must be 3-30 characters. Use letters, numbers, underscore or dash.";
    }
    if (words < 5 || words > 30) return "Description must be between 5 and 30 words.";
    if (!Number(form.discountValue) || Number(form.discountValue) <= 0) {
      return "Discount value is required and must be greater than zero.";
    }
    if (form.discountType === "PERCENTAGE" && Number(form.discountValue) > 100) {
      return "Percentage discount cannot be above 100.";
    }
    if (form.target.scope === "SELECTED_PRODUCTS" && !form.target.productIds.length) {
      return "Select at least one product.";
    }
    if (form.target.scope === "SELECTED_CATEGORIES" && !form.target.categoryIds.length) {
      return "Select at least one category.";
    }
    if (form.timer.enabled) {
      if (!form.timer.startAt) return "Timer start date/time is required.";
      if (form.timer.type === "FIXED_WINDOW" && !form.timer.endAt) return "Timer end date/time is required.";
      if (form.timer.type !== "FIXED_WINDOW" && Number(form.timer.durationMinutes) <= 0) {
        return "Timer duration must be greater than zero.";
      }
    }
    return "";
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");

    const localError = validateForm();
    if (localError) {
      setMessage(localError);
      return;
    }

    const payload = {
      ...form,
      discountValue: Number(form.discountValue),
      minimumOrderAmount: Number(form.minimumOrderAmount),
      maxDiscountAmount: Number(form.maxDiscountAmount),
      usageLimit: Number(form.usageLimit),
      perCustomerLimit: Number(form.perCustomerLimit),
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
      timer: {
        enabled: form.timer.enabled,
        type: form.timer.type,
        startAt: form.timer.enabled ? form.timer.startAt || null : null,
        endAt: form.timer.enabled && form.timer.type === "FIXED_WINDOW" ? form.timer.endAt || null : null,
        durationMinutes:
          form.timer.enabled && form.timer.type !== "FIXED_WINDOW"
            ? Number(form.timer.durationMinutes)
            : 0,
      },
    };

    try {
      if (editing) await adminApi.patch(`/coupons/${editing._id}`, payload);
      else await adminApi.post("/coupons", payload);
      setMessage("Promo code saved.");
      resetEditor();
      await list.refresh();
    } catch (error) {
      setMessage(error instanceof AdminApiError ? error.message : "Promo code save failed");
    }
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      await adminApi.delete(`/coupons/${deleting._id}`);
      setDeleting(null);
      setMessage("Promo code deleted.");
      await list.refresh();
    } catch (error) {
      setMessage(error instanceof AdminApiError ? error.message : "Delete failed");
    }
  };

  const refreshAll = async () => {
    setRefreshing(true);
    setMessage("");
    try {
      await Promise.all([list.refresh(), loadOptions()]);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleProduct = (productId: number) => {
    setForm((current) => {
      const productIds = current.target.productIds.includes(productId)
        ? current.target.productIds.filter((id) => id !== productId)
        : [...current.target.productIds, productId];
      return { ...current, target: { ...current.target, productIds } };
    });
  };

  const toggleCategory = (categoryId: string) => {
    setForm((current) => {
      const categoryIds = current.target.categoryIds.includes(categoryId)
        ? current.target.categoryIds.filter((id) => id !== categoryId)
        : [...current.target.categoryIds, categoryId];
      return { ...current, target: { ...current.target, categoryIds } };
    });
  };

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        title="Promo Codes"
        description="Create discount codes with product/category targeting, purchase rules, usage limits and campaign timers."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              onClick={refreshAll}
              disabled={refreshing}
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-black"
              onClick={openCreate}
            >
              <Plus size={16} />
              Create promo
            </button>
          </div>
        }
      />

      {message ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
          {message}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {list.loading ? (
          <AdminLoadingState />
        ) : list.error ? (
          <AdminErrorState message={list.error} retry={list.refresh} />
        ) : !list.items.length ? (
          <AdminEmptyState title="No promo codes" description="Create the first promo code definition." />
        ) : (
          <div className="divide-y divide-slate-100">
            {list.items.map((coupon) => (
              <div className="grid gap-3 p-4 lg:grid-cols-[1fr_190px_150px_auto]" key={coupon._id}>
                <div className="min-w-0">
                  <p className="font-mono font-semibold">{coupon.code}</p>
                  <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                    {coupon.description || "No description"}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}%` : `Rs ${coupon.discountValue}`} off · used {coupon.usedCount}/{coupon.usageLimit || "∞"} · {targetLabel(coupon.target)}
                  </p>
                </div>
                <div className="text-sm text-slate-600">
                  <p className="font-semibold text-slate-800">{timerLabel(coupon.timer)}</p>
                  <p className="text-xs text-slate-500">Min purchase Rs {coupon.minimumOrderAmount || 0}</p>
                  <p className="text-xs text-slate-500">Max discount Rs {coupon.maxDiscountAmount || 0}</p>
                </div>
                <div className="self-center">
                  <AdminStatusBadge status={coupon.status} />
                </div>
                <div className="flex items-center gap-2 self-center">
                  <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm" onClick={() => edit(coupon)}>
                    Edit
                  </button>
                  <button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700" onClick={() => setDeleting(coupon)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <AdminPagination pagination={list.pagination} onPage={list.setPage} onLimit={list.setLimit} />
      </section>

      {editorOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-3 sm:p-6">
          <div className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
                  <Tags size={14} />
                  Promo editor
                </p>
                <h3 className="mt-1 text-lg font-black text-slate-950">
                  {editing ? `Edit ${editing.code}` : "Create promo code"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Fill required fields first. Use zero for unlimited or no cap rules.
                </p>
              </div>
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-950 hover:text-white"
                onClick={resetEditor}
                aria-label="Close promo editor"
              >
                <X size={18} />
              </button>
            </div>

            <form className="min-h-0 flex-1 overflow-y-auto" onSubmit={submit}>
              <div className="grid gap-5 p-5 lg:grid-cols-[1fr_300px]">
                <div className="grid gap-4">
                  <EditorSection title="Discount details" description="Customer-facing code and the value they receive.">
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field
                        label="Promo code"
                        required
                        helper="3-30 chars. Letters, numbers, dash or underscore."
                        value={form.code}
                        onChange={(value) => setForm({ ...form, code: value.toUpperCase() })}
                      />
                      <label className="grid gap-1.5 text-sm font-medium">
                        Discount type <RequiredMark />
                        <select
                          required
                          className="rounded-lg border border-slate-300 px-3 py-2"
                          value={form.discountType}
                          onChange={(event) =>
                            setForm({ ...form, discountType: event.target.value as PromoForm["discountType"] })
                          }
                        >
                          <option value="PERCENTAGE">Percentage</option>
                          <option value="FIXED">Fixed amount</option>
                        </select>
                        <span className="text-xs font-medium text-slate-500">
                          Percentage is capped at 100 by backend validation.
                        </span>
                      </label>
                    </div>
                    <label className="grid gap-1.5 text-sm font-medium">
                      Description <RequiredMark />
                      <textarea
                        required
                        className="min-h-24 rounded-lg border border-slate-300 px-3 py-2"
                        placeholder="Example: Get extra savings on selected cotton products this week only"
                        value={form.description}
                        onChange={(event) => setForm({ ...form, description: event.target.value })}
                      />
                      <span className="text-xs font-medium text-slate-500">
                        5-30 words. Current: {descriptionWordCount(form.description)} words.
                      </span>
                    </label>
                    <div className="grid gap-3 md:grid-cols-3">
                      <Field
                        label="Discount value"
                        required
                        type="number"
                        helper={form.discountType === "PERCENTAGE" ? "Example: 10 means 10% off." : "Amount in rupees."}
                        value={form.discountValue}
                        onChange={(value) => setForm({ ...form, discountValue: value })}
                      />
                      <Field
                        label="Minimum purchase amount"
                        type="number"
                        helper="Cart/product subtotal must be at least this amount. Use 0 for no minimum."
                        value={form.minimumOrderAmount}
                        onChange={(value) => setForm({ ...form, minimumOrderAmount: value })}
                      />
                      <Field
                        label="Maximum discount cap"
                        type="number"
                        helper="For percentage promos. Use 0 for no maximum cap."
                        value={form.maxDiscountAmount}
                        onChange={(value) => setForm({ ...form, maxDiscountAmount: value })}
                      />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field
                        label="Total usage limit"
                        type="number"
                        helper="Maximum total redemptions. Use 0 for unlimited."
                        value={form.usageLimit}
                        onChange={(value) => setForm({ ...form, usageLimit: value })}
                      />
                      <Field
                        label="Per customer limit"
                        type="number"
                        helper="Reserved for customer-level usage rules. Use 0 for unlimited."
                        value={form.perCustomerLimit}
                        onChange={(value) => setForm({ ...form, perCustomerLimit: value })}
                      />
                    </div>
                  </EditorSection>

                  <EditorSection title="Targeting" description="Choose where this promo code can be applied.">
                    <label className="grid gap-1.5 text-sm font-medium">
                      Applies to <RequiredMark />
                      <select
                        required
                        className="rounded-lg border border-slate-300 px-3 py-2"
                        value={form.target.scope}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            target: {
                              scope: event.target.value as TargetScope,
                              productIds: [],
                              categoryIds: [],
                            },
                          })
                        }
                      >
                        <option value="ALL_PRODUCTS">All products</option>
                        <option value="SELECTED_PRODUCTS">Selected products only</option>
                        <option value="SELECTED_CATEGORIES">Selected categories only</option>
                      </select>
                      <span className="text-xs font-medium text-slate-500">
                        Product page offers show only product/category-targeted promos.
                      </span>
                    </label>

                    {form.target.scope === "SELECTED_PRODUCTS" ? (
                      <SelectionBox
                        title={`${selectedProducts.length} product(s) selected`}
                        loading={optionsLoading}
                        emptyText="No products available."
                      >
                        {products.map((product) => (
                          <CheckRow
                            key={product.product_id}
                            checked={form.target.productIds.includes(product.product_id)}
                            title={product.name || product.title || `Product #${product.product_id}`}
                            meta={`#${product.product_id}${product.status ? ` · ${product.status}` : ""}`}
                            onChange={() => toggleProduct(product.product_id)}
                          />
                        ))}
                      </SelectionBox>
                    ) : null}

                    {form.target.scope === "SELECTED_CATEGORIES" ? (
                      <SelectionBox
                        title={`${selectedCategories.length} category(s) selected`}
                        loading={optionsLoading}
                        emptyText="No categories available."
                      >
                        {categories.map((category) => (
                          <CheckRow
                            key={category._id}
                            checked={form.target.categoryIds.includes(category._id)}
                            title={categoryLabel(category)}
                            meta={category.status || "ACTIVE"}
                            onChange={() => toggleCategory(category._id)}
                          />
                        ))}
                      </SelectionBox>
                    ) : null}
                  </EditorSection>

                  <EditorSection title="Timer and availability" description="Control campaign window and optional countdown display logic.">
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field
                        label="Available from"
                        type="date"
                        helper="Leave empty to make it available immediately."
                        value={form.startsAt}
                        onChange={(value) => setForm({ ...form, startsAt: value })}
                      />
                      <Field
                        label="Available until"
                        type="date"
                        helper="Leave empty for no expiry date."
                        value={form.endsAt}
                        onChange={(value) => setForm({ ...form, endsAt: value })}
                      />
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
                        <input
                          type="checkbox"
                          checked={form.timer.enabled}
                          onChange={(event) => setForm({ ...form, timer: { ...form.timer, enabled: event.target.checked } })}
                        />
                        Enable campaign timer
                      </label>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        Timer is optional. It can power countdown-style promo displays.
                      </p>

                      {form.timer.enabled ? (
                        <div className="mt-3 grid gap-3">
                          <label className="grid gap-1.5 text-sm font-medium">
                            Timer type <RequiredMark />
                            <select
                              required
                              className="rounded-lg border border-slate-300 px-3 py-2"
                              value={form.timer.type}
                              onChange={(event) => setForm({ ...form, timer: { ...form.timer, type: event.target.value as TimerType } })}
                            >
                              <option value="FIXED_WINDOW">Fixed start and end</option>
                              <option value="ONE_TIME">One-time countdown</option>
                              <option value="LOOP">Loop countdown</option>
                            </select>
                          </label>
                          <Field
                            label="Timer start date/time"
                            required
                            type="datetime-local"
                            value={form.timer.startAt}
                            onChange={(value) => setForm({ ...form, timer: { ...form.timer, startAt: value } })}
                          />
                          {form.timer.type === "FIXED_WINDOW" ? (
                            <Field
                              label="Timer end date/time"
                              required
                              type="datetime-local"
                              value={form.timer.endAt}
                              onChange={(value) => setForm({ ...form, timer: { ...form.timer, endAt: value } })}
                            />
                          ) : (
                            <Field
                              label="Timer duration in minutes"
                              required
                              type="number"
                              helper="One-time uses this once. Loop repeats this duration."
                              value={form.timer.durationMinutes}
                              onChange={(value) => setForm({ ...form, timer: { ...form.timer, durationMinutes: value } })}
                            />
                          )}
                        </div>
                      ) : null}
                    </div>
                    <label className="grid gap-1.5 text-sm font-medium">
                      Status <RequiredMark />
                      <select
                        required
                        className="rounded-lg border border-slate-300 px-3 py-2"
                        value={form.status}
                        onChange={(event) => setForm({ ...form, status: event.target.value as PromoForm["status"] })}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="DISABLED">Disabled</option>
                      </select>
                    </label>
                  </EditorSection>
                </div>

                <aside className="h-fit rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-black text-slate-950">Field guide</p>
                  <div className="mt-3 grid gap-3 text-xs font-medium leading-5 text-slate-600">
                    <GuideItem title="Minimum purchase" text="User must buy at least this subtotal before the promo applies." />
                    <GuideItem title="Maximum discount" text="Caps the discount amount. Useful for percentage promos." />
                    <GuideItem title="Usage limit" text="0 means unlimited. Otherwise promo stops after that many paid orders." />
                    <GuideItem title="Selected products" text="Promo appears on those product pages and applies only when cart has them." />
                    <GuideItem title="Selected categories" text="Promo applies to products inside selected categories." />
                    <GuideItem title="Timer type" text="Fixed has start/end. One-time runs once. Loop repeats a duration." />
                  </div>
                </aside>
              </div>

              <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4">
                <p className="text-xs font-semibold text-slate-500">
                  Required fields are marked with <span className="text-red-500">*</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                    onClick={resetEditor}
                  >
                    Cancel
                  </button>
                  <button className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                    Save promo code
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <AdminConfirmDialog
        open={Boolean(deleting)}
        title="Delete promo code?"
        description="This removes the promo code definition from admin storage."
        confirmLabel="Delete promo code"
        onClose={() => setDeleting(null)}
        onConfirm={remove}
      />
    </div>
  );
}

function EditorSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div>
        <h4 className="font-black text-slate-950">{title}</h4>
        <p className="mt-1 text-xs font-medium text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

function GuideItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
      <p className="font-black text-slate-800">{title}</p>
      <p className="mt-1 text-slate-500">{text}</p>
    </div>
  );
}

function RequiredMark() {
  return <span className="text-red-500">*</span>;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  helper = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  helper?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      <span>
        {label} {required ? <RequiredMark /> : null}
      </span>
      <input
        required={required}
        min={type === "number" ? "0" : undefined}
        type={type}
        className="rounded-lg border border-slate-300 px-3 py-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {helper ? <span className="text-xs font-medium text-slate-500">{helper}</span> : null}
    </label>
  );
}

function SelectionBox({
  title,
  loading,
  emptyText,
  children,
}: {
  title: string;
  loading: boolean;
  emptyText: string;
  children: ReactNode;
}) {
  const empty = !loading && (!children || (Array.isArray(children) && children.length === 0));

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
        {title}
      </div>
      <div className="max-h-72 overflow-y-auto p-2 scrollbar-hide">
        {loading ? <p className="px-2 py-4 text-center text-xs font-semibold text-slate-500">Loading options...</p> : null}
        {empty ? <p className="px-2 py-4 text-center text-xs font-semibold text-slate-500">{emptyText}</p> : null}
        {!loading ? <div className="grid gap-1">{children}</div> : null}
      </div>
    </div>
  );
}

function CheckRow({
  checked,
  title,
  meta,
  onChange,
}: {
  checked: boolean;
  title: string;
  meta: string;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 text-sm transition hover:bg-slate-50">
      <input className="mt-1" type="checkbox" checked={checked} onChange={onChange} />
      <span className="min-w-0">
        <span className="block truncate font-semibold text-slate-800">{title}</span>
        <span className="block truncate text-xs font-medium text-slate-500">{meta}</span>
      </span>
    </label>
  );
}
