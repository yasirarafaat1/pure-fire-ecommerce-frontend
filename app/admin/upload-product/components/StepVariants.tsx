"use client";

import { useState } from "react";
import { VariantForm, blankVariant } from "./variant-utils";
import {
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_VIDEO_MAX_BYTES,
  formatBytes,
} from "./product-validation";

type Props = { variants: VariantForm[]; setVariants: (next: VariantForm[]) => void; sku: string; setSku: (v: string) => void };

const toColorInputValue = (value: string) => {
  const color = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) return color;
  if (/^#[0-9A-Fa-f]{3}$/.test(color)) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
  }
  return "#000000";
};

export default function StepVariants({ variants, setVariants, sku, setSku }: Props) {
  const [preview, setPreview] = useState<null | { type: "image" | "video"; src: string; label: string }>(null);
  const [mediaError, setMediaError] = useState("");

  const update = (id: string, patch: Partial<VariantForm>) =>
    setVariants(variants.map((v) => (v.id === id ? { ...v, ...patch } : v)));

  const setPrimary = (id: string) => setVariants(variants.map((v) => ({ ...v, primary: v.id === id })));

  const removeVariant = (id: string) => setVariants(variants.length === 1 ? variants : variants.filter((v) => v.id !== id));

  const updateSize = (id: string, idx: number, key: "label" | "stock", value: string) =>
    setVariants(
      variants.map((v) =>
        v.id === id
          ? {
            ...v,
            sizes: v.sizes.map((s, i) => (i === idx ? { ...s, [key]: value } : s)),
          }
          : v
      )
    );

  const addSize = (id: string) =>
    setVariants(
      variants.map((v) => (v.id === id ? { ...v, sizes: [...v.sizes, { label: "", stock: "" }] } : v))
    );

  const removeSize = (id: string, idx: number) =>
    setVariants(
      variants.map((v) =>
        v.id === id
          ? { ...v, sizes: v.sizes.length === 1 ? v.sizes : v.sizes.filter((_, i) => i !== idx) }
          : v
      )
    );

  const onImagesChange = (id: string, files: FileList | null) => {
    const arr = files ? Array.from(files) : [];
    const current = variants.find((variant) => variant.id === id);
    if (!arr.length || !current) return;
    const nextCount = (current.imagePreviews || []).length + arr.length;
    const invalid = arr.find((file) => !file.type.startsWith("image/"));
    const oversized = arr.find((file) => file.size > PRODUCT_IMAGE_MAX_BYTES);
    if (nextCount > 10) {
      setMediaError("Maximum 10 images are allowed for one color.");
      return;
    }
    if (invalid) {
      setMediaError(`${invalid.name} is not a valid image file.`);
      return;
    }
    if (oversized) {
      setMediaError(`${oversized.name} is ${formatBytes(oversized.size)}. Image limit is ${formatBytes(PRODUCT_IMAGE_MAX_BYTES)}.`);
      return;
    }
    setMediaError("");
    const previews = arr.map((f) => URL.createObjectURL(f));
    setVariants(
      variants.map((v) =>
        v.id === id
          ? {
              ...v,
              imagesFiles: [...v.imagesFiles, ...arr],
              imagePreviews: [...(v.imagePreviews || []), ...previews],
            }
          : v
      )
    );
  };

  const removeImage = (id: string, idx: number) => {
    setVariants(
      variants.map((v) => {
        if (v.id !== id) return v;
        const files = [...v.imagesFiles];
        const previews = [...(v.imagePreviews || [])];
        const target = previews[idx] || "";
        if (target.startsWith("blob:")) {
          const fileIndex =
            previews.slice(0, idx + 1).filter((url) => url.startsWith("blob:")).length - 1;
          if (fileIndex >= 0) files.splice(fileIndex, 1);
        }
        previews.splice(idx, 1);
        return { ...v, imagesFiles: files, imagePreviews: previews };
      })
    );
  };

  const removeVideo = (id: string) =>
    setVariants(
      variants.map((v) =>
        v.id === id ? { ...v, videoFile: null, videoPreview: "" } : v
      )
    );

  const onVideoChange = (id: string, file: File | null) => {
    if (file && !file.type.startsWith("video/")) {
      setMediaError(`${file.name} is not a valid video file.`);
      return;
    }
    if (file && file.size > PRODUCT_VIDEO_MAX_BYTES) {
      setMediaError(`${file.name} is ${formatBytes(file.size)}. Video limit is ${formatBytes(PRODUCT_VIDEO_MAX_BYTES)}.`);
      return;
    }
    setMediaError("");
    update(id, { videoFile: file, videoPreview: file ? URL.createObjectURL(file) : "" });
  };

  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="label">Color variants</p>
          <p className="text-sm text-[var(--muted)]">Each color needs 5–10 images and 1 video.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => setVariants([...variants, blankVariant()])}>
          + Add color
        </button>
      </div>

      {mediaError ? (
        <div className="rounded-[6px] border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {mediaError}
        </div>
      ) : null}

      <div className="grid gap-4">
        {variants.map((v, idx) => (
          <div key={v.id} className="border border-black/10 rounded-[5px] p-4 grid gap-4 bg-white">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex flex-wrap items-center justify gap-2">
                <span className="pill">{idx + 1}</span>
                <label className="flex items-center gap-2">
                  <span className="text-sm text-[var(--muted)]">Color</span>
                  <input
                    type="color"
                    className="h-10 w-10 border border-black/20 rounded-[5px] bg-white"
                    value={toColorInputValue(v.color)}
                    onChange={(e) => update(v.id, { color: e.target.value.toUpperCase() })}
                  />
                </label>
                <div className="flex gap-2">
                  <input
                    className="input w-32"
                    placeholder="#000"
                    value={v.color}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      const normalized = val ? (val.startsWith("#") ? val : `#${val}`) : "#000000";
                      const upper = normalized.toUpperCase();
                      update(v.id, { color: upper });
                    }}
                  />
                  <button
                    type="button"
                    className={`btn btn-ghost ${v.primary ? "border border-black/50 text-black" : ""}`}
                    onClick={() => setPrimary(v.id)}
                  >
                    {v.primary ? "Primary" : "Mark primary"}
                  </button>
                  <button type="button" className="btn btn-ghost text-red-600" onClick={() => removeVariant(v.id)}>
                    Remove
                  </button>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <input
                  className="input"
                  placeholder="SKU"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                />
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Price"
                  value={v.price}
                  onChange={(e) => update(v.id, { price: e.target.value })}
                />
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Discounted price"
                  value={v.discountedPrice}
                  onChange={(e) => update(v.id, { discountedPrice: e.target.value })}
                />
              </div>

            </div>

            <div className="grid md:grid-cols-[1.6fr_1fr] gap-4">
              <div className="grid gap-2">
                <div className="label">Sizes & stock</div>
                <div className="grid gap-2">
                  {v.sizes.map((s, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        className="input w-20"
                        placeholder="Size"
                        value={s.label}
                        onChange={(e) => updateSize(v.id, i, "label", e.target.value.toUpperCase())}
                      />
                      <input
                        className="input w-24"
                        placeholder="Stock"
                        type="number"
                        min="0"
                        value={s.stock}
                        onChange={(e) => updateSize(v.id, i, "stock", e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-ghost text-red-600"
                        onClick={() => removeSize(v.id, i)}
                        disabled={v.sizes.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-ghost w-fit" onClick={() => addSize(v.id)}>
                    + Add size
                  </button>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-[1.6fr_1fr] gap-4">
              <div className="grid gap-3 rounded-[6px] border border-black/10 bg-slate-50/70 p-3">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <label className="label">Images (min 5, max 10)</label>
                    <div className="text-xs text-[var(--muted)]">
                      {(v.imagePreviews || []).length} total, {v.imagesFiles.length} new. First image becomes cover.
                    </div>
                  </div>
                  <label className="btn btn-ghost cursor-pointer">
                    Add images
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => onImagesChange(v.id, e.target.files)}
                    />
                  </label>
                </div>
                <div className="grid max-h-[420px] grid-cols-2 gap-2 overflow-y-auto pr-1 md:grid-cols-3">
                  {(v.imagePreviews || []).map((url, i) => (
                    <div key={`${url}-${i}`} className="group relative overflow-hidden rounded-[6px] border border-black/10 bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="preview" className="aspect-square w-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-black/65 p-2 text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => setPreview({ type: "image", src: url, label: `${v.color || "Color"} image ${i + 1}` })}
                        >
                          Full view
                        </button>
                        <button type="button" className="text-red-200" onClick={() => removeImage(v.id, i)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 rounded-[6px] border border-black/10 bg-slate-50/70 p-3">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <label className="label">Video (exactly 1)</label>
                    <p className="text-xs text-[var(--muted)]">Use full view to inspect playback clearly.</p>
                  </div>
                  <label className="btn btn-ghost cursor-pointer">
                    {v.videoPreview ? "Replace video" : "Add video"}
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => onVideoChange(v.id, e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
                {v.videoPreview && (
                  <div className="relative overflow-hidden rounded-[6px] border border-black/10 bg-black">
                    <video className="aspect-video w-full object-contain" controls src={v.videoPreview}>
                      preview
                    </video>
                    <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/65 p-2 text-[11px] font-semibold text-white">
                      <button type="button" onClick={() => setPreview({ type: "video", src: v.videoPreview || "", label: `${v.color || "Color"} video` })}>
                        Full view
                      </button>
                      <button type="button" className="text-red-200" onClick={() => removeVideo(v.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {preview ? (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/80 p-4" onClick={() => setPreview(null)}>
          <div className="grid w-full max-w-5xl gap-3" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 text-white">
              <p className="truncate text-sm font-semibold">{preview.label}</p>
              <button type="button" className="btn bg-white text-black hover:bg-white" onClick={() => setPreview(null)}>
                Close
              </button>
            </div>
            {preview.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.src} alt={preview.label} className="max-h-[82vh] w-full rounded-[8px] object-contain" />
            ) : (
              <video src={preview.src} controls autoPlay className="max-h-[82vh] w-full rounded-[8px] bg-black object-contain" />
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
