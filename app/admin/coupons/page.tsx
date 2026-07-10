"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Plus, RefreshCw, Tags, X } from "lucide-react";
import AdminConfirmDialog from "../components/AdminConfirmDialog";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminPagination from "../components/AdminPagination";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
} from "../components/AdminStates";
import AdminStatusBadge from "../components/AdminStatusBadge";
import { useAdminList } from "../hooks/useAdminList";
import { AdminApiError, adminApi } from "../lib/adminApi";

type TargetScope = "ALL_PRODUCTS" | "SELECTED_PRODUCTS" | "SELECTED_CATEGORIES";
type TimerType = "FIXED_WINDOW" | "ONE_TIME" | "LOOP";
type MinimumRequirementType = "" | "ORDER_AMOUNT" | "ITEM_QUANTITY";

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
  minimumQuantity: number;
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
  minimumRequirement: MinimumRequirementType;
  minimumOrderAmount: string;
  minimumQuantity: string;
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
    type: TimerType | "";
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
  minimumRequirement: "",
  minimumOrderAmount: "0",
  minimumQuantity: "1",
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
    type: "",
    startAt: "",
    endAt: "",
    durationMinutes: "60",
  },
};

const inputClass =
  "h-11 w-full rounded-[10px] border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

const textareaClass =
  "min-h-24 w-full resize-y rounded-[10px] border border-slate-300 bg-white px-3 py-2 text-sm font-semibold leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5";

const selectClass =
  "h-11 w-full rounded-[10px] border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition hover:border-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5";

const toDateTimeInput = (value?: string | null) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const toApiDateTime = (value: string) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const categoryLabel = (category: CategoryOption) => {
  const parents = (category.ancestors || [])
    .map((item) => item.name)
    .filter(Boolean);

  return [...parents, category.name].join(" / ");
};

const targetLabel = (target?: PromoTarget) => {
  if (!target || target.scope === "ALL_PRODUCTS") return "All products";
  if (target.scope === "SELECTED_PRODUCTS") {
    return `${target.productIds?.length || 0} product(s)`;
  }
  return `${target.categoryIds?.length || 0} category(s)`;
};

const targetScopeLabel = (scope: TargetScope) => {
  if (scope === "SELECTED_PRODUCTS") return "Selected products";
  if (scope === "SELECTED_CATEGORIES") return "Selected categories";
  return "All products";
};

const timerLabel = (timer?: PromoTimer) => {
  if (!timer?.enabled) return "Timer off";
  if (timer.type === "FIXED_WINDOW") return "Fixed start and end";
  if (timer.type === "ONE_TIME") return "One-time countdown";
  return "Repeating countdown";
};

const timerTypeLabel = (type: TimerType | "") => {
  if (type === "FIXED_WINDOW") return "Fixed start and end";
  if (type === "ONE_TIME") return "One-time countdown";
  if (type === "LOOP") return "Repeating countdown";
  return "Timer type not selected";
};

const normalizeTimerType = (type?: string | null): TimerType | "" => {
  if (type === "FIXED_WINDOW" || type === "ONE_TIME" || type === "LOOP") return type;
  return "";
};

const minimumRequirementFromCoupon = (coupon: Coupon): MinimumRequirementType => {
  if (Number(coupon.minimumOrderAmount || 0) > 0) return "ORDER_AMOUNT";
  if (Number(coupon.minimumQuantity || 1) > 1) return "ITEM_QUANTITY";
  return "";
};

const descriptionWordCount = (value: string) =>
  value.trim().split(/\s+/).filter(Boolean).length;

const money = (value: number | string) => `Rs ${Number(value || 0)}`;

const discountText = (
  discountType: "PERCENTAGE" | "FIXED",
  discountValue: number | string,
) => {
  const value = Number(discountValue || 0);

  if (!value) return "No discount value";

  return discountType === "PERCENTAGE" ? `${value}% off` : `Rs ${value} off`;
};

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
  const [saving, setSaving] = useState(false);

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
      setMessage(
        "Products and categories could not be loaded. Targeting options may be limited.",
      );
    } finally {
      setOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    if (!editorOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [editorOpen]);

  const selectedProducts = useMemo(
    () =>
      products.filter((product) =>
        form.target.productIds.includes(product.product_id),
      ),
    [form.target.productIds, products],
  );

  const selectedCategories = useMemo(
    () =>
      categories.filter((category) =>
        form.target.categoryIds.includes(category._id),
      ),
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
      minimumRequirement: minimumRequirementFromCoupon(coupon),
      minimumOrderAmount: String(coupon.minimumOrderAmount || 0),
      minimumQuantity: String(coupon.minimumQuantity || 1),
      maxDiscountAmount: String(coupon.maxDiscountAmount || 0),
      usageLimit: String(coupon.usageLimit || 0),
      perCustomerLimit: String(coupon.perCustomerLimit || 0),
      startsAt: toDateTimeInput(coupon.startsAt),
      endsAt: toDateTimeInput(coupon.endsAt),
      status: coupon.status,
      target: {
        scope: coupon.target?.scope || "ALL_PRODUCTS",
        productIds: coupon.target?.productIds || [],
        categoryIds: coupon.target?.categoryIds || [],
      },
      timer: {
        enabled: Boolean(coupon.timer?.enabled),
        type: normalizeTimerType(coupon.timer?.type),
        startAt: toDateTimeInput(coupon.timer?.startAt),
        endAt: toDateTimeInput(coupon.timer?.endAt),
        durationMinutes: String(coupon.timer?.durationMinutes || 60),
      },
    });
    setEditorOpen(true);
  };

  const validateForm = () => {
    const words = descriptionWordCount(form.description);

    if (!form.code.trim()) return "Enter a promo code.";
    if (!/^[A-Z0-9_-]{3,30}$/.test(form.code.trim())) {
      return "Promo code must be 3-30 characters. Use A-Z, numbers, dash or underscore only.";
    }

    if (words < 5 || words > 30) {
      return "Description must be 5-30 words.";
    }

    if (!Number(form.discountValue) || Number(form.discountValue) <= 0) {
      return "Enter a discount value greater than zero.";
    }

    if (form.discountType === "PERCENTAGE" && Number(form.discountValue) > 100) {
      return "Percentage discount cannot be more than 100.";
    }

    if (!form.minimumRequirement) {
      return "Select either minimum order value or minimum item quantity.";
    }

    if (
      form.minimumRequirement === "ORDER_AMOUNT" &&
      (!Number(form.minimumOrderAmount) || Number(form.minimumOrderAmount) <= 0)
    ) {
      return "Enter a minimum order value greater than zero.";
    }

    if (
      form.minimumRequirement === "ITEM_QUANTITY" &&
      (!Number(form.minimumQuantity) || Number(form.minimumQuantity) <= 1)
    ) {
      return "Enter a minimum item quantity greater than 1.";
    }

    if (
      form.target.scope === "SELECTED_PRODUCTS" &&
      !form.target.productIds.length
    ) {
      return "Select at least one product for this promo.";
    }

    if (
      form.target.scope === "SELECTED_CATEGORIES" &&
      !form.target.categoryIds.length
    ) {
      return "Select at least one category for this promo.";
    }

    if (form.timer.enabled) {
      if (!form.timer.type) return "Select timer type.";
      if (!form.timer.startAt) return "Select timer start date and time.";
      if (form.timer.type === "FIXED_WINDOW" && !form.timer.endAt) {
        return "Select timer end date and time.";
      }
      if (
        form.timer.type !== "FIXED_WINDOW" &&
        Number(form.timer.durationMinutes) <= 0
      ) {
        return "Timer duration must be greater than zero.";
      }
    }

    return "";
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setMessage("");

    const localError = validateForm();

    if (localError) {
      setMessage(localError);
      return;
    }

    const payload = {
      ...form,
      discountValue: Number(form.discountValue),
      minimumOrderAmount:
        form.minimumRequirement === "ORDER_AMOUNT"
          ? Number(form.minimumOrderAmount)
          : 0,
      minimumQuantity:
        form.minimumRequirement === "ITEM_QUANTITY"
          ? Number(form.minimumQuantity)
          : 1,
      maxDiscountAmount: Number(form.maxDiscountAmount),
      usageLimit: Number(form.usageLimit),
      perCustomerLimit: Number(form.perCustomerLimit),
      startsAt: toApiDateTime(form.startsAt),
      endsAt: toApiDateTime(form.endsAt),
      timer: {
        enabled: form.timer.enabled,
        type: form.timer.type,
        startAt: form.timer.enabled ? toApiDateTime(form.timer.startAt) : null,
        endAt:
          form.timer.enabled && form.timer.type === "FIXED_WINDOW"
            ? toApiDateTime(form.timer.endAt)
            : null,
        durationMinutes:
          form.timer.enabled && form.timer.type !== "FIXED_WINDOW"
            ? Number(form.timer.durationMinutes)
            : 0,
      },
    };

    setSaving(true);

    try {
      if (editing) await adminApi.patch(`/coupons/${editing._id}`, payload);
      else await adminApi.post("/coupons", payload);

      setMessage("Promo code saved successfully.");
      resetEditor();
      await list.refresh();
    } catch (error) {
      setMessage(
        error instanceof AdminApiError ? error.message : "Promo code save failed.",
      );
    } finally {
      setSaving(false);
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
      setMessage(error instanceof AdminApiError ? error.message : "Delete failed.");
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
        description="Create and manage discount codes with targeting, usage limits and optional countdown timers."
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
          <AdminEmptyState
            title="No promo codes"
            description="Create a promo code to offer discounts on selected products, categories or the full store."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {list.items.map((coupon) => (
              <div
                className="grid gap-3 p-4 lg:grid-cols-[1fr_190px_150px_auto]"
                key={coupon._id}
              >
                <div className="min-w-0">
                  <p className="font-mono font-semibold">{coupon.code}</p>

                  <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                    {coupon.description || "No description added"}
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {discountText(coupon.discountType, coupon.discountValue)} ·
                    Used {coupon.usedCount}/{coupon.usageLimit || "∞"} ·{" "}
                    {targetLabel(coupon.target)}
                  </p>
                </div>

                <div className="text-sm text-slate-600">
                  <p className="font-semibold text-slate-800">
                    {timerLabel(coupon.timer)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Min amount {money(coupon.minimumOrderAmount || 0)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Min quantity {coupon.minimumQuantity || 1}
                  </p>
                  <p className="text-xs text-slate-500">
                    Max discount {money(coupon.maxDiscountAmount || 0)}
                  </p>
                </div>

                <div className="self-center">
                  <AdminStatusBadge status={coupon.status} />
                </div>

                <div className="flex items-center gap-2 self-center">
                  <button
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                    onClick={() => edit(coupon)}
                  >
                    Edit
                  </button>

                  <button
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700"
                    onClick={() => setDeleting(coupon)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <AdminPagination
          pagination={list.pagination}
          onPage={list.setPage}
          onLimit={list.setLimit}
        />
      </section>

      {editorOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-3 sm:p-6">
          <div className="flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
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
                  Add discount details, choose where it applies and set limits if
                  needed.
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
              <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="grid min-w-0 gap-4">
                  <EditorSection
                    title="Discount details"
                    description="Set the promo code, discount value and customer-facing description."
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field
                        label="Promo code"
                        required
                        helper="Use 3-30 characters: A-Z, numbers, dash or underscore."
                        value={form.code}
                        onChange={(value) =>
                          setForm({ ...form, code: value.toUpperCase() })
                        }
                      />

                      <SelectField
                        label="Discount type"
                        required
                        value={form.discountType}
                        helper="Use percentage for offers like 10% off. Use fixed for flat rupee discounts."
                        onChange={(value) =>
                          setForm({
                            ...form,
                            discountType: value as PromoForm["discountType"],
                          })
                        }
                      >
                        <option value="PERCENTAGE">Percentage discount</option>
                        <option value="FIXED">Fixed amount discount</option>
                      </SelectField>
                    </div>

                    <TextAreaField
                      label="Description"
                      required
                      placeholder="Example: Get extra savings on selected products this week."
                      value={form.description}
                      helper={`Keep it clear in 5-30 words. Current: ${descriptionWordCount(
                        form.description,
                      )} words.`}
                      onChange={(value) =>
                        setForm({ ...form, description: value })
                      }
                    />

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <Field
                        label="Discount value"
                        required
                        type="number"
                        helper={
                          form.discountType === "PERCENTAGE"
                            ? "Example: 10 means 10% off."
                            : "Flat discount amount in rupees."
                        }
                        value={form.discountValue}
                        onChange={(value) =>
                          setForm({ ...form, discountValue: value })
                        }
                      />

                      <SelectField
                        label="Requirement type"
                        required
                        value={form.minimumRequirement}
                        helper="Choose one condition customers must satisfy."
                        onChange={(value) =>
                          setForm({
                            ...form,
                            minimumRequirement: value as MinimumRequirementType,
                            minimumOrderAmount:
                              value === "ORDER_AMOUNT" ? form.minimumOrderAmount : "0",
                            minimumQuantity:
                              value === "ITEM_QUANTITY" ? form.minimumQuantity : "1",
                          })
                        }
                      >
                        <option value="">Select requirement</option>
                        <option value="ORDER_AMOUNT">Minimum order value</option>
                        <option value="ITEM_QUANTITY">Minimum item quantity</option>
                      </SelectField>

                      {form.minimumRequirement === "ITEM_QUANTITY" ? (
                        <Field
                          label="Minimum item quantity"
                          required
                          type="number"
                          helper="Cart quantity required. Must be greater than 1."
                          value={form.minimumQuantity}
                          onChange={(value) =>
                            setForm({ ...form, minimumQuantity: value })
                          }
                        />
                      ) : (
                        <Field
                          label="Minimum order amount"
                          required={form.minimumRequirement === "ORDER_AMOUNT"}
                          type="number"
                          helper="Subtotal in rupees. Must be greater than 0."
                          value={form.minimumOrderAmount}
                          onChange={(value) =>
                            setForm({ ...form, minimumOrderAmount: value })
                          }
                        />
                      )}

                      <Field
                        label="Maximum discount"
                        type="number"
                        helper="Useful for percentage discounts. Use 0 for no cap."
                        value={form.maxDiscountAmount}
                        onChange={(value) =>
                          setForm({ ...form, maxDiscountAmount: value })
                        }
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <Field
                        label="Total usage limit"
                        type="number"
                        helper="Use 0 for unlimited total usage."
                        value={form.usageLimit}
                        onChange={(value) =>
                          setForm({ ...form, usageLimit: value })
                        }
                      />

                      <Field
                        label="Per customer limit"
                        type="number"
                        helper="Use 0 for unlimited use per customer."
                        value={form.perCustomerLimit}
                        onChange={(value) =>
                          setForm({ ...form, perCustomerLimit: value })
                        }
                      />
                    </div>
                  </EditorSection>

                  <EditorSection
                    title="Targeting"
                    description="Choose whether this promo applies to the full store, selected products or selected categories."
                  >
                    <SelectField
                      label="Applies to"
                      required
                      value={form.target.scope}
                      helper="Product/category targeting helps show relevant offers on matching product pages."
                      onChange={(value) =>
                        setForm({
                          ...form,
                          target: {
                            scope: value as TargetScope,
                            productIds: [],
                            categoryIds: [],
                          },
                        })
                      }
                    >
                      <option value="ALL_PRODUCTS">All products</option>
                      <option value="SELECTED_PRODUCTS">Selected products</option>
                      <option value="SELECTED_CATEGORIES">Selected categories</option>
                    </SelectField>

                    {form.target.scope === "SELECTED_PRODUCTS" ? (
                      <SelectionBox
                        title={`${selectedProducts.length} product(s) selected`}
                        loading={optionsLoading}
                        emptyText="No products available."
                      >
                        {products.map((product) => (
                          <CheckRow
                            key={product.product_id}
                            checked={form.target.productIds.includes(
                              product.product_id,
                            )}
                            title={
                              product.name ||
                              product.title ||
                              `Product #${product.product_id}`
                            }
                            meta={`#${product.product_id}${
                              product.status ? ` · ${product.status}` : ""
                            }`}
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
                            checked={form.target.categoryIds.includes(
                              category._id,
                            )}
                            title={categoryLabel(category)}
                            meta={category.status || "ACTIVE"}
                            onChange={() => toggleCategory(category._id)}
                          />
                        ))}
                      </SelectionBox>
                    ) : null}
                  </EditorSection>

                  <EditorSection
                    title="Availability and timer"
                    description="Set promo availability and optional countdown display settings."
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field
                        label="Available from"
                        type="datetime-local"
                        helper="Leave empty to allow immediate use. Date and time use your local timezone."
                        value={form.startsAt}
                        onChange={(value) =>
                          setForm({ ...form, startsAt: value })
                        }
                      />

                      <Field
                        label="Available until"
                        type="datetime-local"
                        helper="Leave empty if the promo should not expire automatically. Date and time use your local timezone."
                        value={form.endsAt}
                        onChange={(value) =>
                          setForm({ ...form, endsAt: value })
                        }
                      />
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                      <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700">
                        <span>
                          <span className="block">Enable countdown timer</span>
                          <span className="mt-1 block text-xs font-medium text-slate-500">
                            Optional. Use it when the promo needs a countdown on
                            the storefront.
                          </span>
                        </span>

                        <input
                          type="checkbox"
                          checked={form.timer.enabled}
                          onChange={(event) =>
                            setForm({
                              ...form,
                              timer: {
                                ...form.timer,
                                enabled: event.target.checked,
                              },
                            })
                          }
                          className="mt-1 h-4 w-4 rounded border-slate-300 accent-slate-950"
                        />
                      </label>

                      {form.timer.enabled ? (
                        <div className="mt-3 grid gap-3">
                          <SelectField
                            label="Timer type"
                            required
                            value={form.timer.type}
                            helper="Repeating countdown keeps restarting until the promo availability expires."
                            onChange={(value) =>
                              setForm({
                                ...form,
                                timer: {
                                  ...form.timer,
                                  type: value as TimerType | "",
                                },
                              })
                            }
                          >
                            <option value="">Select timer type</option>
                            <option value="FIXED_WINDOW">
                              Fixed start and end
                            </option>
                            <option value="ONE_TIME">One-time countdown</option>
                            <option value="LOOP">Repeating countdown</option>
                          </SelectField>

                          <Field
                            label="Timer starts at"
                            required
                            type="datetime-local"
                            value={form.timer.startAt}
                            onChange={(value) =>
                              setForm({
                                ...form,
                                timer: { ...form.timer, startAt: value },
                              })
                            }
                          />

                          {form.timer.type === "FIXED_WINDOW" ? (
                            <Field
                              label="Timer ends at"
                              required
                              type="datetime-local"
                              value={form.timer.endAt}
                              onChange={(value) =>
                                setForm({
                                  ...form,
                                  timer: { ...form.timer, endAt: value },
                                })
                              }
                            />
                          ) : form.timer.type === "ONE_TIME" || form.timer.type === "LOOP" ? (
                            <Field
                              label="Duration in minutes"
                              required
                              type="number"
                              helper="One-time uses this once. Repeating timer loops by this duration until the coupon expires."
                              value={form.timer.durationMinutes}
                              onChange={(value) =>
                                setForm({
                                  ...form,
                                  timer: {
                                    ...form.timer,
                                    durationMinutes: value,
                                  },
                                })
                              }
                            />
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <SelectField
                      label="Status"
                      required
                      value={form.status}
                      onChange={(value) =>
                        setForm({
                          ...form,
                          status: value as PromoForm["status"],
                        })
                      }
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="DISABLED">Disabled</option>
                    </SelectField>
                  </EditorSection>
                </div>

                <aside className="h-fit rounded-xl border border-slate-200 bg-slate-50 p-4 lg:sticky lg:top-5">
                  <p className="text-sm font-black text-slate-950">
                    Promo summary
                  </p>

                  <div className="mt-3 grid gap-3 text-xs font-medium leading-5 text-slate-600">
                    <SummaryItem label="Code" value={form.code || "Not added"} />
                    <SummaryItem
                      label="Discount"
                      value={discountText(form.discountType, form.discountValue)}
                    />
                    <SummaryItem
                      label="Target"
                      value={targetScopeLabel(form.target.scope)}
                    />
                    <SummaryItem
                      label="Selected"
                      value={
                        form.target.scope === "SELECTED_PRODUCTS"
                          ? `${form.target.productIds.length} product(s)`
                          : form.target.scope === "SELECTED_CATEGORIES"
                            ? `${form.target.categoryIds.length} category(s)`
                            : "All products"
                      }
                    />
                    <SummaryItem
                      label="Requirement"
                      value={
                        form.minimumRequirement === "ORDER_AMOUNT"
                          ? `Min order ${money(form.minimumOrderAmount)}`
                          : form.minimumRequirement === "ITEM_QUANTITY"
                            ? `Min quantity ${Number(form.minimumQuantity || 1)} item(s)`
                            : "Not selected"
                      }
                    />
                    <SummaryItem
                      label="Usage"
                      value={
                        Number(form.usageLimit || 0) > 0
                          ? `${form.usageLimit} total use(s)`
                          : "Unlimited"
                      }
                    />
                    <SummaryItem
                      label="Timer"
                      value={
                        form.timer.enabled
                          ? timerTypeLabel(form.timer.type)
                          : "Timer off"
                      }
                    />
                    <SummaryItem label="Status" value={form.status} />
                  </div>
                </aside>
              </div>

              <div className="sticky bottom-0 z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4">
                <p className="text-xs font-semibold text-slate-500">
                  Required fields are marked with{" "}
                  <span className="text-red-500">*</span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={resetEditor}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={saving}
                  >
                    {saving ? (editing ? "Updating..." : "Saving...") : editing ? "Update promo" : "Save promo"}
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
        description="This promo code will be removed permanently. Existing orders will not be changed."
        confirmLabel="Delete promo"
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
    <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <div>
        <h4 className="font-black text-slate-950">{title}</h4>
        <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
      <p className="font-black text-slate-800">{label}</p>
      <p className="mt-1 break-words text-slate-500">{value}</p>
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
      <span className="font-black text-slate-700">
        {label} {required ? <RequiredMark /> : null}
      </span>

      <input
        required={required}
        min={type === "number" ? "0" : undefined}
        type={type}
        className={inputClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />

      {helper ? (
        <span className="text-xs font-medium leading-5 text-slate-500">
          {helper}
        </span>
      ) : null}
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  required = false,
  helper = "",
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  helper?: string;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      <span className="font-black text-slate-700">
        {label} {required ? <RequiredMark /> : null}
      </span>

      <textarea
        required={required}
        className={textareaClass}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />

      {helper ? (
        <span className="text-xs font-medium leading-5 text-slate-500">
          {helper}
        </span>
      ) : null}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
  required = false,
  helper = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  required?: boolean;
  helper?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      <span className="font-black text-slate-700">
        {label} {required ? <RequiredMark /> : null}
      </span>

      <select
        required={required}
        className={selectClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>

      {helper ? (
        <span className="text-xs font-medium leading-5 text-slate-500">
          {helper}
        </span>
      ) : null}
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
  const empty =
    !loading && (!children || (Array.isArray(children) && children.length === 0));

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">
        {title}
      </div>

      <div className="max-h-72 overflow-y-auto p-2 scrollbar-hide">
        {loading ? (
          <p className="px-2 py-4 text-center text-xs font-semibold text-slate-500">
            Loading options...
          </p>
        ) : null}

        {empty ? (
          <p className="px-2 py-4 text-center text-xs font-semibold text-slate-500">
            {emptyText}
          </p>
        ) : null}

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
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-sm transition ${
        checked
          ? "border-slate-950 bg-slate-50"
          : "border-transparent hover:border-slate-200 hover:bg-slate-50"
      }`}
    >
      <input
        className="mt-1 h-4 w-4 rounded border-slate-300 accent-slate-950"
        type="checkbox"
        checked={checked}
        onChange={onChange}
      />

      <span className="min-w-0">
        <span className="block truncate font-semibold text-slate-800">
          {title}
        </span>
        <span className="block truncate text-xs font-medium text-slate-500">
          {meta}
        </span>
      </span>
    </label>
  );
}
