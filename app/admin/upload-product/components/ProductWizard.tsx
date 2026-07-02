"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import FooterControls from "./FooterControls";
import StepCategory from "./StepCategory";
import StepDetails from "./StepDetails";
import StepVariants from "./StepVariants";
import { CategoryNode } from "./types";
import { VariantForm, blankVariant, toSizePayload } from "./variant-utils";
import { adminApi } from "../../lib/adminApi";
import type {
  EditProduct,
  ProductColorVariant,
  ProductFormState,
  ProductSize,
} from "./product-editor-types";
import { submitProduct } from "./product-submit";
import {
  validateProductDetails,
  validateProductUploadSize,
  validateProductVariants,
} from "./product-validation";
import { X } from "lucide-react";

type Props = { product?: EditProduct | null; onSaved?: () => void; onClose?: () => void };
const steps = [{ id: 1, label: "Category" }, { id: 2, label: "Details" }, { id: 3, label: "Variants" }];
const minHighlights = 6, maxHighlights = 10;
export default function ProductWizard({ product, onSaved, onClose }: Props) {
  const initializedProductKeyRef = useRef<string>("");
  const lastAutosavedKeyRef = useRef<string>("");
  const [active, setActive] = useState(1);
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [level1, setLevel1] = useState("");
  const [level2, setLevel2] = useState("");
  const [level3, setLevel3] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [message, setMessage] = useState("");
  const [busyAction, setBusyAction] = useState<null | "draft" | "published">(null);
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [autosavedDraftId, setAutosavedDraftId] = useState<number | null>(product?.draft_id || null);
  const [form, setForm] = useState<ProductFormState>({ name: "", sku: "", price: "", selling_price: "", quantity: "", colors: "", sizes: "" });
  const [descriptionHtml, setDescriptionHtml] = useState("");
  const [keyHighlights, setKeyHighlights] = useState<{ key: string; value: string }[]>(Array.from({ length: minHighlights }, () => ({ key: "", value: "" })));
  const [variants, setVariants] = useState<VariantForm[]>([blankVariant(true)]);
  useEffect(() => {
    adminApi.get<{ status: boolean; categories: CategoryNode[] }>("/categories/tree")
      .then((d) => d.status && setTree(d.categories || []))
      .catch(() => setMessage("Backend unreachable. Check API URL/env."));
  }, []);
  const findNode = (list: CategoryNode[], id: string | null) => {
    const stack = id ? [...list] : [];
    while (stack.length) {
      const n = stack.pop()!;
      if (n._id === id) return n;
      if (n.children) stack.push(...n.children);
    }
    return null;
  };

  useEffect(() => {
    if (!product) return;
    const productKey = product.product_id ? `product-${product.product_id}` : product.draft_id ? `draft-${product.draft_id}` : "edit";
    if (initializedProductKeyRef.current === productKey) return;
    const targetIdRaw = typeof product.catagory_id === "object" ? product.catagory_id?._id : product.catagory_id;
    const targetId = targetIdRaw ? String(targetIdRaw) : "";
    if (!targetId || tree.length === 0) return;
    initializedProductKeyRef.current = productKey;
    const path: string[] = [];
    const dfs = (nodes: CategoryNode[], target: string, trail: string[]): boolean => {
      for (const n of nodes) {
        const next = [...trail, n._id];
        if (String(n._id) === target) {
          path.push(...next);
          return true;
        }
        if (n.children && dfs(n.children, target, next)) return true;
      }
      return false;
    };
    dfs(tree, targetId, []);
    setLevel1(path[0] || "");
    setLevel2(path[1] || "");
    setLevel3(path[2] || "");
    setCategoryId(path[path.length - 1] || targetId);

    setForm({
      name: product.name || "",
      sku: product.sku || "",
      price: product.price?.toString() || "",
      selling_price: product.selling_price?.toString() || "",
      quantity: product.quantity?.toString() || "",
      colors: (product.colors || []).join(", "),
      sizes: (product.sizes || []).join(", "),
    });
    setDescriptionHtml(product.description || "");
    const highlights = (product.key_highlights || []).map((highlight) => ({ key: highlight.key || "", value: highlight.value || "" }));
    const padded =
      highlights.length >= minHighlights
        ? highlights.slice(0, maxHighlights)
        : [...highlights, ...Array.from({ length: minHighlights - highlights.length }, () => ({ key: "", value: "" }))];
    setKeyHighlights(padded);

    if (product.colorVariants?.length) {
      const fallbackSizes = Array.isArray(product.sizes) ? product.sizes : [];
      setVariants(
        product.colorVariants.map((cv: ProductColorVariant, idx: number) => ({
          id: `variant-${product.product_id || "edit"}-${idx}`,
          color: cv.color,
          price: cv.price ? cv.price.toString() : "",
          discountedPrice: cv.discountedPrice ? cv.discountedPrice.toString() : "",
          sizes:
            Array.isArray(cv.sizes) && cv.sizes.length
              ? cv.sizes.map((size: ProductSize | string) => ({
                  label: typeof size === "string" ? size : size.label,
                  stock: typeof size === "string" ? "" : String(size.stock ?? ""),
                }))
              : fallbackSizes.map((size: ProductSize | string) => ({
                  label: typeof size === "string" ? size : size.label,
                  stock: "",
                })) || [{ label: "", stock: "" }],
          imagesFiles: [],
          videoFile: null,
          imagePreviews: cv.images || [],
          videoPreview: cv.video || "",
          primary: !!cv.primary || idx === 0,
        }))
      );
    } else {
      setVariants([blankVariant(true)]);
    }
    const stage = (product.draft_stage || "").toLowerCase();
    if (stage === "details") setActive(2);
    else if (stage === "media" || stage === "variants" || stage === "pricing" || stage === "complete") setActive(3);
  }, [product, tree]);

  useEffect(() => {
    setAutosavedDraftId(product?.draft_id || null);
    lastAutosavedKeyRef.current = "";
  }, [product?.draft_id, product?.product_id]);

  const level1Options = tree;
  const level2Options = useMemo(() => (level1 ? findNode(tree, level1)?.children || [] : []), [tree, level1]);
  const level3Options = useMemo(() => (level2 ? findNode(tree, level2)?.children || [] : []), [tree, level2]);
  useEffect(() => {
    // Only allow final (sub-child) selection to enable next/publish
    setCategoryId(level3 || "");
  }, [level3]);

  useEffect(() => {
    if (!variants.length) return;
    const primary = variants.find((v) => v.primary) || variants[0];
    const totalQty = variants
      .map((v) => toSizePayload(v.sizes).reduce((sum, s) => sum + (Number.isFinite(s.stock) ? s.stock : 0), 0))
      .reduce((a, b) => a + b, 0);
    setForm((prev) => ({
      ...prev,
      price: primary.price || prev.price,
      selling_price: primary.discountedPrice || primary.price || prev.selling_price,
      quantity: totalQty ? String(totalQty) : prev.quantity,
      colors: variants.map((v) => v.color).filter(Boolean).join(", "),
      sizes: Array.from(new Set(variants.flatMap((v) => toSizePayload(v.sizes).map((s) => s.label)))).join(", "),
    }));
  }, [variants]);

  const autosaveKey = useMemo(() => {
    const variantPayload = variants.map((variant) => ({
      color: variant.color,
      price: variant.price,
      discountedPrice: variant.discountedPrice,
      sizes: variant.sizes,
      primary: variant.primary,
      images: (variant.imagePreviews || []).filter((url) => /^https?:\/\//i.test(url)),
      video: variant.videoPreview && /^https?:\/\//i.test(variant.videoPreview) ? variant.videoPreview : "",
    }));

    return JSON.stringify({
      active,
      categoryId,
      form,
      descriptionHtml,
      keyHighlights,
      variants: variantPayload,
    });
  }, [active, categoryId, descriptionHtml, form, keyHighlights, variants]);

  const hasAutosaveContent = useMemo(
    () =>
      Boolean(
        categoryId ||
          form.name.trim() ||
          form.sku.trim() ||
          descriptionHtml.replace(/<[^>]+>/g, "").trim() ||
          keyHighlights.some((item) => item.key.trim() || item.value.trim()) ||
          variants.some(
            (variant) =>
              variant.color.trim() ||
              variant.price.trim() ||
              variant.discountedPrice.trim() ||
              variant.sizes.some((size) => size.label.trim() || size.stock.trim())
          )
      ),
    [categoryId, descriptionHtml, form.name, form.sku, keyHighlights, variants]
  );

  useEffect(() => {
    const autosaveEnabled = !product?.product_id || Boolean(product?.draft_id || autosavedDraftId);
    if (!autosaveEnabled || !hasAutosaveContent || busyAction) return undefined;
    if (autosaveKey === lastAutosavedKeyRef.current) return undefined;

    const timer = window.setTimeout(async () => {
      setAutosaveStatus("saving");
      try {
        const response = await submitProduct({
          product,
          draftIdOverride: autosavedDraftId,
          form,
          categoryId,
          status: "draft",
          activeStep: active,
          description: descriptionHtml,
          highlights: keyHighlights,
          variants,
          omitNewFiles: true,
        });
        const nextDraftId = response.draft?.draft_id || response.product?.draft_id || autosavedDraftId;
        if (nextDraftId) setAutosavedDraftId(nextDraftId);
        lastAutosavedKeyRef.current = autosaveKey;
        setAutosaveStatus("saved");
      } catch {
        setAutosaveStatus("error");
      }
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [
    active,
    autosaveKey,
    autosavedDraftId,
    busyAction,
    categoryId,
    descriptionHtml,
    form,
    hasAutosaveContent,
    keyHighlights,
    product,
    variants,
  ]);

  const handleInput = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const renderInput = (key: keyof typeof form, label: string, placeholder: string, asTextArea = false) => (
    <label className="grid gap-2"><span className="label">{label}</span>{asTextArea ? (
      <textarea className="input h-28 resize-none" value={form[key]} onChange={(e) => handleInput(key, e.target.value)} placeholder={placeholder} />
    ) : (
      <input className="input" value={form[key]} onChange={(e) => handleInput(key, e.target.value)} placeholder={placeholder} />
    )}</label>
  );

  const validateDetails = () =>
    validateProductDetails(form, descriptionHtml, keyHighlights, minHighlights, maxHighlights);
  const validateVariants = () => validateProductVariants(variants);
  const submit = async (status: "draft" | "published") => {
    setMessage("");
    const requiredBasics = ["sku", "price", "selling_price"];
    const missingBasics = requiredBasics.filter((key) => !form[key as keyof ProductFormState].trim());
    if (missingBasics.length) {
      return setMessage(`Missing required: ${missingBasics.join(", ")}`);
    }
    if (Number(form.price) <= Number(form.selling_price)) {
      return setMessage("Price must be greater than discounted price.");
    }
    const skuValue = (form.sku || "").trim().toUpperCase();
    if (!/^[A-Z]{3,5}-\d{2,5}$/.test(skuValue)) {
      return setMessage("SKU must look like ABC-001 (3-5 uppercase letters, dash, 2-5 digits).");
    }
    if (!categoryId) return setMessage("Select category, sub category, sub child.");
    const detailErr = validateDetails();
    if (detailErr) return setMessage(detailErr);

    const vErr = validateVariants();
    if (vErr) return setMessage(vErr);
    const uploadErr = validateProductUploadSize(variants);
    if (uploadErr) return setMessage(uploadErr);

    if (status === "published" && !form.name.trim()) return setMessage("Missing: name");

    setBusyAction(status);
    try {
      const response = await submitProduct({
        product,
        draftIdOverride: autosavedDraftId,
        form,
        categoryId,
        status,
        activeStep: active,
        description: descriptionHtml,
        highlights: keyHighlights,
        variants,
      });
      const nextDraftId = response.draft?.draft_id || response.product?.draft_id || null;
      if (status === "draft" && nextDraftId) setAutosavedDraftId(nextDraftId);
      setMessage(status === "published" ? "Published successfully." : "Draft saved.");
      onSaved?.();
      onClose?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error. Check backend.";
      const canAutoSaveDraft = status === "published" && (!product || product.draft_id);
      if (canAutoSaveDraft) {
        try {
          await submitProduct({
            product,
            draftIdOverride: autosavedDraftId,
            form,
            categoryId,
            status: "draft",
            activeStep: active,
            description: descriptionHtml,
            highlights: keyHighlights,
            variants,
            omitNewFiles: true,
          });
          setMessage(`Publish failed: ${message}. Saved as draft.`);
          onSaved?.();
          return;
        } catch (draftError) {
          const draftMessage = draftError instanceof Error ? draftError.message : "Draft save failed.";
          setMessage(`Publish failed: ${message}. Auto draft save failed: ${draftMessage}`);
          return;
        }
      }
      setMessage(message);
    } finally {
      setBusyAction(null);
    }
  };
  const skuOk = /^[A-Z]{3,5}-\d{2,5}$/.test((form.sku || "").trim().toUpperCase());
  const basicsOk = !!(form.name.trim() && form.sku.trim() && form.price.trim() && form.selling_price.trim());
  const detailErr = validateDetails();
  const variantErr = validateVariants();
  const publishReady = !!categoryId && !detailErr && !variantErr && basicsOk && skuOk;
  const publishBlockReason =
    !categoryId
      ? "Select category, sub category, sub child."
      : !basicsOk
        ? "Missing: name, SKU, price, discounted price."
        : !skuOk
          ? "SKU format invalid."
          : detailErr
            ? detailErr
            : variantErr
              ? variantErr
              : "";
  return (
    <div className="card p-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">Multi-step flow</p>
          <h2 className="text-xl font-semibold">Upload product</h2>
        </div>
        <button className="btn btn-ghost" onClick={() => onClose?.()}>
          <X size={20} />
          Close
        </button>
      </header>
      <div className="flex flex-wrap gap-2 mb-6">
        {steps.map((s) => (
          <button
            key={s.id}
            className={`pill ${active === s.id ? "bg-[var(--accent)] text-white" : active > s.id ? "bg-green-100 text-green-900 border border-green-300" : ""} cursor-pointer`}
            onClick={() => setActive(s.id)}
          >
            {s.id}. {s.label}
          </button>
        ))}
      </div>
      {active === 1 && (
        <StepCategory
          level1={level1}
          level2={level2}
          level3={level3}
          setLevel1={setLevel1}
          setLevel2={setLevel2}
          setLevel3={setLevel3}
          level1Options={level1Options}
          level2Options={level2Options}
          level3Options={level3Options}
        />
      )}

      {active === 2 && (
        <StepDetails
          renderInput={renderInput}
          keyHighlights={keyHighlights}
          setKeyHighlights={setKeyHighlights}
          min={minHighlights}
          max={maxHighlights}
          description={descriptionHtml}
          setDescription={setDescriptionHtml}
        />
      )}
      {active === 3 && <StepVariants variants={variants} setVariants={setVariants} sku={form.sku} setSku={(v) => setForm((p) => ({ ...p, sku: v }))} />}
      <FooterControls
        active={active}
        categorySelected={!!categoryId}
        canNext={
          active === 1
            ? !!categoryId
            : active === 2
              ? !validateDetails()
              : active === 3
                ? !validateVariants()
                : true
        }
        canPublish={publishReady}
        canDraft={!product}
        busyAction={busyAction}
        onBack={() => setActive(Math.max(1, active - 1))}
        onNext={() => setActive(Math.min(3, active + 1))}
        onDraft={() => submit("draft")}
        onPublish={() => submit("published")}
        onRequireCategory={() => setMessage("Select category, sub category, sub child.")}
      />
      {(!product?.product_id || autosavedDraftId) && autosaveStatus !== "idle" ? (
        <p className="mt-3 text-xs font-semibold text-[var(--muted)]">
          {autosaveStatus === "saving"
            ? "Autosaving draft..."
            : autosaveStatus === "saved"
              ? "Draft autosaved."
              : "Autosave failed. Use Save Draft before leaving."}
        </p>
      ) : null}
      {message && <p className="mt-3 text-sm text-[var(--muted)]">{message}</p>}
      {!publishReady && !message && (
        <p className="mt-3 text-sm text-[var(--muted)]">{publishBlockReason}</p>
      )}
    </div>
  );
}
