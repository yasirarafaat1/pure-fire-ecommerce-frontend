"use client";
import { useEffect, useMemo, useState } from "react";
import FooterControls from "./FooterControls";
import StepCategory from "./StepCategory";
import StepDetails from "./StepDetails";
import StepVariants from "./StepVariants";
import { CategoryNode } from "./types";
import { VariantForm, blankVariant, toSizePayload } from "./variant-utils";

type EditProduct = any;
type Props = { product?: EditProduct | null; onSaved?: () => void; onClose?: () => void };
const API_BASE = "/api/admin";
const steps = [{ id: 1, label: "Category" }, { id: 2, label: "Details" }, { id: 3, label: "Variants" }];
const minHighlights = 6, maxHighlights = 10;
export default function ProductWizard({ product, onSaved, onClose }: Props) {
  const [active, setActive] = useState(1);
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [level1, setLevel1] = useState("");
  const [level2, setLevel2] = useState("");
  const [level3, setLevel3] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [message, setMessage] = useState("");
  const [busyAction, setBusyAction] = useState<null | "draft" | "published">(null);
  const [form, setForm] = useState({ name: "", sku: "", price: "", selling_price: "", quantity: "", colors: "", sizes: "" });
  const [descriptionHtml, setDescriptionHtml] = useState("");
  const [keyHighlights, setKeyHighlights] = useState<{ key: string; value: string }[]>(Array.from({ length: minHighlights }, () => ({ key: "", value: "" })));
  const [variants, setVariants] = useState<VariantForm[]>([blankVariant(true)]);
  useEffect(() => {
    fetch(`${API_BASE}/categories/tree`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => d.status && setTree(d.categories || []))
      .catch(() => setMessage("Backend unreachable. Check API URL/env."));
  }, []);
  const findNode = (list: CategoryNode[], id: string | null) => {
    const stack = id ? [...list] : [];
    while (stack.length) {
      const n = stack.pop()!;
      if (n._id === id) return n;
      n.children && stack.push(...n.children);
    }
    return null;
  };

  useEffect(() => {
    if (!product) return;
    const targetIdRaw = typeof product.catagory_id === "object" ? product.catagory_id?._id : product.catagory_id;
    const targetId = targetIdRaw ? String(targetIdRaw) : "";
    if (targetId && !categoryId) setCategoryId(targetId);
    if (!targetId || tree.length === 0) return;
    const path: string[] = [];
    const dfs = (nodes: CategoryNode[], target: string, trail: string[]): boolean => {
      for (const n of nodes) {
        const next = [...trail, n._id];
        if (String(n._id) === target) return path.push(...next), true;
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
    const highlights = (product.key_highlights || []).map((h: any) => ({ key: h.key || "", value: h.value || "" }));
    const padded =
      highlights.length >= minHighlights
        ? highlights.slice(0, maxHighlights)
        : [...highlights, ...Array.from({ length: minHighlights - highlights.length }, () => ({ key: "", value: "" }))];
    setKeyHighlights(padded);

    if (product.colorVariants?.length) {
      const fallbackSizes = Array.isArray(product.sizes) ? product.sizes : [];
      setVariants(
        product.colorVariants.map((cv: any, idx: number) => ({
          id: `${cv.color}-${idx}`,
          color: cv.color,
          price: cv.price ? cv.price.toString() : "",
          discountedPrice: cv.discountedPrice ? cv.discountedPrice.toString() : "",
          sizes:
            Array.isArray(cv.sizes) && cv.sizes.length
              ? cv.sizes.map((s: any) => ({
                  label: typeof s === "string" ? s : s.label,
                  stock: typeof s === "string" ? "" : String(s.stock ?? ""),
                }))
              : fallbackSizes.map((s: any) => ({
                  label: typeof s === "string" ? s : s.label,
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
  const handleInput = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const renderInput = (key: keyof typeof form, label: string, placeholder: string, asTextArea = false) => (
    <label className="grid gap-2"><span className="label">{label}</span>{asTextArea ? (
      <textarea className="input h-28 resize-none" value={form[key]} onChange={(e) => handleInput(key, e.target.value)} placeholder={placeholder} />
    ) : (
      <input className="input" value={form[key]} onChange={(e) => handleInput(key, e.target.value)} placeholder={placeholder} />
    )}</label>
  );

  const validateDetails = () => {
    if (!form.name.trim()) return "Product name required.";
    if (!descriptionHtml.replace(/<[^>]+>/g, "").trim()) return "Description required.";
    const clean = keyHighlights.filter((h) => h.key.trim() && h.value.trim());
    return clean.length < minHighlights || clean.length > maxHighlights ? `Enter ${minHighlights}-${maxHighlights} key highlights.` : "";
  };

  const validateVariants = () => {
    if (!variants.length) return "Add at least one color.";
    for (const v of variants) {
      if (!v.color.trim()) return "Color name required.";
      const vPrice = Number(v.price);
      const vDiscount = Number(v.discountedPrice || v.price);
      if (!Number.isFinite(vPrice) || vPrice <= 0) return "Price must be a positive number.";
      if (!Number.isFinite(vDiscount) || vDiscount <= 0) return "Discounted price must be a positive number.";
      if (vDiscount >= vPrice) return "Price must be greater than discounted price.";
      const imgCount = (v.imagesFiles?.length || 0) + (v.imagePreviews?.length || 0);
      if (!imgCount || imgCount < 5) return `Color ${v.color || "color"}: need 5-10 images.`;
      const hasVid = !!v.videoFile || !!v.videoPreview;
      if (!hasVid) return `Color ${v.color || "color"}: video required.`;
      const sizesPayload = toSizePayload(v.sizes);
      if (!sizesPayload.length) return `Color ${v.color || "color"}: add sizes with stock.`;
      const invalidSize = sizesPayload.find((s) => !/^[A-Z]+$/.test(s.label));
      if (invalidSize) return "Sizes must be uppercase letters only (e.g., S, M, L, XL).";
      const invalidStock = sizesPayload.find((s) => Number.isNaN(s.stock) || s.stock < 0);
      if (invalidStock) return "Stock must be a non-negative number.";
    }
    return "";
  };
  const submit = async (status: "draft" | "published") => {
    setMessage("");
    const requiredBasics = ["sku", "price", "selling_price"];
    const missingBasics = requiredBasics.filter((k) => !(form as any)[k]?.trim());
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

    if (status === "published" && !form.name.trim()) return setMessage("Missing: name");

    setBusyAction(status);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === "sku") return;
      fd.append(k, v || "");
    });
    fd.append("sku", skuValue);
    fd.append("categoryId", categoryId || "");
    fd.append("status", status);
    fd.append("draft_stage", status === "published" ? "complete" : steps[active - 1].label.toLowerCase());
    fd.append("description", descriptionHtml);
    fd.append("key_highlights", JSON.stringify(keyHighlights.filter((h) => h.key && h.value)));

    const withPrimary = variants.some((v) => v.primary) ? variants : variants.map((v, i) => ({ ...v, primary: i === 0 }));
    const processed = withPrimary.map((v) => ({
      color: v.color.trim(),
      price: Number(v.price) || 0,
      discountedPrice: Number(v.discountedPrice || v.price) || 0,
      imageCount: (v.imagesFiles?.length || 0) + (v.imagePreviews?.length || 0),
      hasVideo: !!v.videoFile || !!v.videoPreview,
      images: v.imagesFiles.length ? [] : v.imagePreviews || [],
      video: v.videoPreview || "",
      sizes: toSizePayload(v.sizes),
      primary: !!v.primary,
    }));
    const primary = processed.find((v) => v.primary) || processed[0];
    const totalQty = processed
      .map((v) => v.sizes.reduce((sum, s) => sum + (Number.isFinite(s.stock) ? s.stock : 0), 0))
      .reduce((a, b) => a + b, 0);
    fd.set("price", String(primary.price));
    fd.set("selling_price", String(primary.discountedPrice || primary.price));
    fd.set("quantity", String(totalQty || form.quantity || 0));
    fd.append("colorVariants", JSON.stringify(processed));
    withPrimary.forEach((v) => {
      v.imagesFiles.forEach((file) => fd.append("variantImages", file));
      if (v.videoFile) fd.append("variantVideos", v.videoFile);
    });

    try {
      let url = `${API_BASE}/upload-product`;
      let method: "POST" | "PATCH" = "POST";
      if (product?.draft_id) {
        url = `${API_BASE}/drafts/${product.draft_id}`;
        method = "PATCH";
      } else if (!product && status === "draft") {
        url = `${API_BASE}/drafts`;
      } else if (product && !product.draft_id) {
        url = `${API_BASE}/update-product/${product.product_id}`;
        method = "PATCH";
      }
      const res = await fetch(url, { method, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");
      setMessage(status === "published" ? "Published successfully." : "Draft saved.");
      onSaved?.();
      onClose?.();
    } catch (err: any) {
      setMessage(err.message || "Server error. Check backend.");
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
        <button className="btn btn-ghost" onClick={() => onClose?.()}>Close</button>
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
        onCancel={() => onClose?.()}
        onDraft={() => submit("draft")}
        onPublish={() => submit("published")}
        onRequireCategory={() => setMessage("Select category, sub category, sub child.")}
      />
      {message && <p className="mt-3 text-sm text-[var(--muted)]">{message}</p>}
      {!publishReady && !message && (
        <p className="mt-3 text-sm text-[var(--muted)]">{publishBlockReason}</p>
      )}
    </div>
  );
}
