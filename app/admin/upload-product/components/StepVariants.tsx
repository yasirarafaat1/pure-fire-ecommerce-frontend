"use client";

import { useState, type CSSProperties } from "react";
import {
  AlertCircle,
  GripVertical,
  ImagePlus,
  Maximize2,
  Plus,
  Star,
  Trash2,
  UploadCloud,
  Video,
  X,
} from "lucide-react";
import { VariantForm, blankVariant } from "./variant-utils";
import {
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_VIDEO_MAX_BYTES,
  formatBytes,
} from "./product-validation";

type Props = {
  variants: VariantForm[];
  setVariants: (next: VariantForm[]) => void;
  sku: string;
  setSku: (v: string) => void;
};

const toColorInputValue = (value: string) => {
  const color = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) return color;
  if (/^#[0-9A-Fa-f]{3}$/.test(color)) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
  }
  return "#000000";
};

export default function StepVariants({
  variants,
  setVariants,
  sku,
  setSku,
}: Props) {
  const [preview, setPreview] = useState<null | {
    type: "image" | "video";
    src: string;
    label: string;
  }>(null);
  const [mediaError, setMediaError] = useState("");
  const [draggedImage, setDraggedImage] = useState<null | {
    variantId: string;
    index: number;
  }>(null);

  const update = (id: string, patch: Partial<VariantForm>) =>
    setVariants(variants.map((v) => (v.id === id ? { ...v, ...patch } : v)));

  const setPrimary = (id: string) =>
    setVariants(variants.map((v) => ({ ...v, primary: v.id === id })));

  const removeVariant = (id: string) =>
    setVariants(
      variants.length === 1 ? variants : variants.filter((v) => v.id !== id),
    );

  const updateSize = (
    id: string,
    idx: number,
    key: "label" | "stock",
    value: string,
  ) =>
    setVariants(
      variants.map((v) =>
        v.id === id
          ? {
              ...v,
              sizes: v.sizes.map((s, i) =>
                i === idx ? { ...s, [key]: value } : s,
              ),
            }
          : v,
      ),
    );

  const addSize = (id: string) =>
    setVariants(
      variants.map((v) =>
        v.id === id
          ? { ...v, sizes: [...v.sizes, { label: "", stock: "" }] }
          : v,
      ),
    );

  const removeSize = (id: string, idx: number) =>
    setVariants(
      variants.map((v) =>
        v.id === id
          ? {
              ...v,
              sizes:
                v.sizes.length === 1
                  ? v.sizes
                  : v.sizes.filter((_, i) => i !== idx),
            }
          : v,
      ),
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
      setMediaError(
        `${oversized.name} is ${formatBytes(
          oversized.size,
        )}. Image limit is ${formatBytes(PRODUCT_IMAGE_MAX_BYTES)}.`,
      );
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
          : v,
      ),
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
            previews.slice(0, idx + 1).filter((url) => url.startsWith("blob:"))
              .length - 1;

          if (fileIndex >= 0) files.splice(fileIndex, 1);
        }

        previews.splice(idx, 1);

        return { ...v, imagesFiles: files, imagePreviews: previews };
      }),
    );
  };

  const reorderImages = (id: string, fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    setVariants(
      variants.map((v) => {
        if (v.id !== id) return v;

        const originalPreviews = v.imagePreviews || [];
        const previews = [...originalPreviews];
        const [movedPreview] = previews.splice(fromIndex, 1);

        if (!movedPreview) return v;

        previews.splice(toIndex, 0, movedPreview);

        const filesByBlobUrl = new Map<string, File>();
        let fileIndex = 0;

        originalPreviews.forEach((url) => {
          if (!url.startsWith("blob:")) return;

          const file = v.imagesFiles[fileIndex];

          if (file) filesByBlobUrl.set(url, file);

          fileIndex += 1;
        });

        return {
          ...v,
          imagePreviews: previews,
          imagesFiles: previews
            .filter((url) => url.startsWith("blob:"))
            .map((url) => filesByBlobUrl.get(url))
            .filter((file): file is File => Boolean(file)),
        };
      }),
    );
  };

  const removeVideo = (id: string) =>
    setVariants(
      variants.map((v) =>
        v.id === id ? { ...v, videoFile: null, videoPreview: "" } : v,
      ),
    );

  const onVideoChange = (id: string, file: File | null) => {
    if (file && !file.type.startsWith("video/")) {
      setMediaError(`${file.name} is not a valid video file.`);
      return;
    }

    if (file && file.size > PRODUCT_VIDEO_MAX_BYTES) {
      setMediaError(
        `${file.name} is ${formatBytes(
          file.size,
        )}. Video limit is ${formatBytes(PRODUCT_VIDEO_MAX_BYTES)}.`,
      );
      return;
    }

    setMediaError("");
    update(id, {
      videoFile: file,
      videoPreview: file ? URL.createObjectURL(file) : "",
    });
  };

  return (
    <section className="variant-step grid gap-5">
      <div className="overflow-hidden rounded-[4px] border border-black/10 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="relative overflow-hidden border-b border-black/10 bg-[linear-gradient(135deg,#ffffff,#fff7e8_58%,#f8fafc)] px-4 py-4 sm:px-5">
          <div className="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full bg-amber-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-10 h-32 w-32 rounded-full bg-slate-950/5 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 shadow-sm">
                Product options
              </div>

              <h2 className="mt-3 text-xl font-black tracking-[-0.03em] text-slate-950 sm:text-2xl">
                Color variants
              </h2>

              <p className="mt-1 max-w-xl text-sm font-medium leading-6 text-slate-500">
                Add every product color with size-wise stock, images and
                optional video. First image will be used as the cover image.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-[4px] border border-black/10 bg-white px-3 py-2 text-xs font-bold text-slate-500 shadow-sm">
                <span className="text-slate-950">{variants.length}</span>{" "}
                color{variants.length === 1 ? "" : "s"}
              </div>

              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[4px] bg-slate-950 px-4 text-sm font-black text-white shadow-[0_12px_26px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-amber-400 hover:text-slate-950 active:scale-[0.98]"
                type="button"
                onClick={() => setVariants([...variants, blankVariant()])}
              >
                <Plus size={16} strokeWidth={2.8} />
                Add color
              </button>
            </div>
          </div>
        </div>

        {mediaError ? (
          <div className="border-b border-red-200 bg-red-50 px-4 py-3 sm:px-5">
            <div className="flex items-start gap-3 rounded-[4px] border border-red-200 bg-white px-3 py-3 text-sm font-bold text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{mediaError}</span>
            </div>
          </div>
        ) : null}

        <div className="grid gap-5 p-4 sm:p-5">
          {variants.map((v, idx) => {
            const images = v.imagePreviews || [];
            const imageCount = images.length;
            const primaryLabel = v.primary ? "Primary color" : "Secondary color";
            const colorValue = toColorInputValue(v.color);

            return (
              <div
                key={v.id}
                className="variant-card overflow-hidden rounded-[4px] border border-black/10 bg-white shadow-[0_14px_38px_rgba(15,23,42,0.05)] transition hover:border-black/20 hover:shadow-[0_20px_56px_rgba(15,23,42,0.08)]"
              >
                <div className="border-b border-black/10 bg-slate-50/70 px-4 py-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex min-w-0 flex-wrap items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-[4px] border border-black/10 bg-white text-sm font-black text-slate-950 shadow-sm">
                        {String(idx + 1).padStart(2, "0")}
                      </span>

                      <div
                        className="h-11 w-11 shrink-0 rounded-full border border-black/10 shadow-[inset_0_0_0_4px_rgba(255,255,255,0.75),0_10px_20px_rgba(15,23,42,0.12)]"
                        style={{ backgroundColor: colorValue }}
                        aria-hidden="true"
                      />

                      <div className="min-w-[190px]">
                        <p className="text-sm font-black text-slate-950">
                          Variant color
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-slate-500">
                          {primaryLabel}
                        </p>
                      </div>

                      <label className="grid gap-1">
                        <span className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
                          Picker
                        </span>
                        <input
                          type="color"
                          className="h-10 w-12 cursor-pointer rounded-[4px] border border-black/15 bg-white p-1 shadow-sm"
                          value={colorValue}
                          onChange={(e) =>
                            update(v.id, { color: e.target.value.toUpperCase() })
                          }
                        />
                      </label>

                      <label className="grid gap-1">
                        <span className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
                          Hex code
                        </span>
                        <input
                          className="h-10 w-32 rounded-[4px] border border-black/10 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5"
                          placeholder="#000"
                          value={v.color}
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            const normalized = val
                              ? val.startsWith("#")
                                ? val
                                : `#${val}`
                              : "#000000";
                            const upper = normalized.toUpperCase();
                            update(v.id, { color: upper });
                          }}
                        />
                      </label>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className={`inline-flex h-10 items-center justify-center gap-2 rounded-[4px] border px-3 text-sm font-black transition active:scale-[0.98] ${
                          v.primary
                            ? "border-amber-300 bg-amber-100 text-slate-950"
                            : "border-black/10 bg-white text-slate-600 hover:border-slate-950 hover:bg-slate-950 hover:text-white"
                        }`}
                        onClick={() => setPrimary(v.id)}
                      >
                        <Star
                          size={15}
                          strokeWidth={2.6}
                          className={v.primary ? "fill-amber-400 text-amber-500" : ""}
                        />
                        {v.primary ? "Primary" : "Mark primary"}
                      </button>

                      <button
                        type="button"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-[4px] border border-red-200 bg-white px-3 text-sm font-black text-red-600 transition hover:border-red-600 hover:bg-red-600 hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
                        onClick={() => removeVariant(v.id)}
                        disabled={variants.length === 1}
                      >
                        <Trash2 size={15} strokeWidth={2.6} />
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <label className="grid gap-1.5">
                      <span className="text-xs font-black text-slate-500">
                        SKU
                      </span>
                      <input
                        className="h-11 rounded-[4px] border border-black/10 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5"
                        placeholder="SKU"
                        value={sku}
                        onChange={(e) => setSku(e.target.value.toUpperCase())}
                      />
                    </label>

                    <label className="grid gap-1.5">
                      <span className="text-xs font-black text-slate-500">
                        Price
                      </span>
                      <input
                        className="h-11 rounded-[4px] border border-black/10 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Price"
                        value={v.price}
                        onChange={(e) => update(v.id, { price: e.target.value })}
                      />
                    </label>

                    <label className="grid gap-1.5">
                      <span className="text-xs font-black text-slate-500">
                        Discounted price
                      </span>
                      <input
                        className="h-11 rounded-[4px] border border-black/10 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Discounted price"
                        value={v.discountedPrice}
                        onChange={(e) =>
                          update(v.id, { discountedPrice: e.target.value })
                        }
                      />
                    </label>
                  </div>
                </div>

                <div className="grid gap-4 p-4">
                  <div className="rounded-[4px] border border-black/10 bg-white p-3">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-black text-slate-950">
                          Sizes & stock
                        </h3>
                        <p className="mt-0.5 text-xs font-semibold text-slate-500">
                          Add size labels and available stock for this color.
                        </p>
                      </div>

                      <button
                        type="button"
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-[4px] border border-black/10 bg-slate-50 px-3 text-xs font-black text-slate-700 transition hover:border-slate-950 hover:bg-slate-950 hover:text-white active:scale-[0.98]"
                        onClick={() => addSize(v.id)}
                      >
                        <Plus size={14} strokeWidth={2.8} />
                        Add size
                      </button>
                    </div>

                    <div className="grid gap-2">
                      {v.sizes.map((s, i) => (
                        <div
                          key={i}
                          className="grid gap-2 rounded-[4px] border border-black/10 bg-slate-50/70 p-2 sm:grid-cols-[1fr_1fr_auto] sm:items-center"
                        >
                          <input
                            className="h-10 rounded-[4px] border border-black/10 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5"
                            placeholder="Size"
                            value={s.label}
                            onChange={(e) =>
                              updateSize(
                                v.id,
                                i,
                                "label",
                                e.target.value.toUpperCase(),
                              )
                            }
                          />

                          <input
                            className="h-10 rounded-[4px] border border-black/10 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5"
                            placeholder="Stock"
                            type="number"
                            min="0"
                            value={s.stock}
                            onChange={(e) =>
                              updateSize(v.id, i, "stock", e.target.value)
                            }
                          />

                          <button
                            type="button"
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-[4px] border border-red-200 bg-white px-3 text-xs font-black text-red-600 transition hover:border-red-600 hover:bg-red-600 hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
                            onClick={() => removeSize(v.id, i)}
                            disabled={v.sizes.length === 1}
                          >
                            <Trash2 size={14} strokeWidth={2.6} />
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1.45fr_0.9fr]">
                    <div className="overflow-hidden rounded-[4px] border border-black/10 bg-slate-50/70">
                      <div className="border-b border-black/10 bg-white px-3 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[4px] bg-slate-950 text-white shadow-sm">
                              <ImagePlus size={18} strokeWidth={2.5} />
                            </span>

                            <div className="min-w-0">
                              <h3 className="text-sm font-black text-slate-950">
                                Images
                              </h3>
                              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                                Drag to sort. Min 5, max 10. First image is
                                cover.
                              </p>
                            </div>
                          </div>

                          <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[4px] border border-black/10 bg-white px-3 text-sm font-black text-slate-800 transition hover:border-slate-950 hover:bg-slate-950 hover:text-white active:scale-[0.98]">
                            <UploadCloud size={16} strokeWidth={2.6} />
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

                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">
                            {imageCount} total
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">
                            {v.imagesFiles.length} new
                          </span>
                          {v.videoPreview ? (
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-slate-800">
                              Video added
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="variant-media-scroll grid max-h-[430px] grid-cols-2 gap-3 overflow-y-auto p-3 sm:grid-cols-3">
                        {images.length === 0 ? (
                          <label className="col-span-full grid min-h-[180px] cursor-pointer place-items-center rounded-[4px] border border-dashed border-black/15 bg-white p-6 text-center transition hover:border-slate-950 hover:bg-slate-50">
                            <span>
                              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-700">
                                <UploadCloud size={22} strokeWidth={2.4} />
                              </span>
                              <span className="mt-3 block text-sm font-black text-slate-950">
                                Upload product images
                              </span>
                              <span className="mt-1 block text-xs font-semibold text-slate-500">
                                Select 5-10 images for this color variant.
                              </span>
                            </span>

                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) => onImagesChange(v.id, e.target.files)}
                            />
                          </label>
                        ) : null}

                        {images.map((url, i) => (
                          <div
                            key={`${url}-${i}`}
                            draggable
                            onDragStart={() =>
                              setDraggedImage({ variantId: v.id, index: i })
                            }
                            onDragEnd={() => setDraggedImage(null)}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => {
                              event.preventDefault();
                              if (!draggedImage || draggedImage.variantId !== v.id)
                                return;
                              reorderImages(v.id, draggedImage.index, i);
                              setDraggedImage(null);
                            }}
                            className={`group relative cursor-grab overflow-hidden rounded-[4px] border bg-white shadow-sm transition active:cursor-grabbing ${
                              draggedImage?.variantId === v.id &&
                              draggedImage.index === i
                                ? "scale-[0.98] border-slate-950 opacity-60"
                                : "border-black/10 hover:border-slate-950/40 hover:shadow-[0_12px_26px_rgba(15,23,42,0.12)]"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt="preview"
                              className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105"
                            />

                            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/75 px-2 py-1 text-[10px] font-black text-white backdrop-blur">
                              {i === 0 ? "Cover" : `#${i + 1}`}
                            </span>

                            <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-slate-950 opacity-0 shadow-sm backdrop-blur transition group-hover:opacity-100">
                              <GripVertical size={14} strokeWidth={2.5} />
                            </span>

                            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/80 to-black/10 p-2 text-[11px] font-bold text-white opacity-0 transition duration-300 group-hover:opacity-100">
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 backdrop-blur transition hover:bg-white hover:text-slate-950"
                                onClick={() =>
                                  setPreview({
                                    type: "image",
                                    src: url,
                                    label: `${v.color || "Color"} image ${i + 1}`,
                                  })
                                }
                              >
                                <Maximize2 size={12} />
                                Full view
                              </button>

                              <button
                                type="button"
                                className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-1 text-red-100 backdrop-blur transition hover:bg-red-600 hover:text-white"
                                onClick={() => removeImage(v.id, i)}
                              >
                                <Trash2 size={12} />
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-[4px] border border-black/10 bg-slate-50/70">
                      <div className="border-b border-black/10 bg-white px-3 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[4px] bg-slate-950 text-white shadow-sm">
                              <Video size={18} strokeWidth={2.5} />
                            </span>

                            <div className="min-w-0">
                              <h3 className="text-sm font-black text-slate-950">
                                Video
                              </h3>
                              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                                Optional. Shows after cover image.
                              </p>
                            </div>
                          </div>

                          <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[4px] border border-black/10 bg-white px-3 text-sm font-black text-slate-800 transition hover:border-slate-950 hover:bg-slate-950 hover:text-white active:scale-[0.98]">
                            <UploadCloud size={16} strokeWidth={2.6} />
                            {v.videoPreview ? "Replace" : "Add video"}
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) =>
                                onVideoChange(v.id, e.target.files?.[0] || null)
                              }
                            />
                          </label>
                        </div>
                      </div>

                      <div className="p-3">
                        {v.videoPreview ? (
                          <div className="relative overflow-hidden rounded-[4px] border border-black/10 bg-black shadow-sm">
                            <video
                              className="aspect-video w-full object-contain"
                              controls
                              src={v.videoPreview}
                            >
                              preview
                            </video>

                            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/65 p-2 text-[11px] font-semibold text-white">
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 backdrop-blur transition hover:bg-white hover:text-slate-950"
                                onClick={() =>
                                  setPreview({
                                    type: "video",
                                    src: v.videoPreview || "",
                                    label: `${v.color || "Color"} video`,
                                  })
                                }
                              >
                                <Maximize2 size={12} />
                                Full view
                              </button>

                              <button
                                type="button"
                                className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-1 text-red-100 backdrop-blur transition hover:bg-red-600 hover:text-white"
                                onClick={() => removeVideo(v.id)}
                              >
                                <Trash2 size={12} />
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="grid min-h-[190px] cursor-pointer place-items-center rounded-[4px] border border-dashed border-black/15 bg-white p-6 text-center transition hover:border-slate-950 hover:bg-slate-50">
                            <span>
                              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-700">
                                <Video size={22} strokeWidth={2.4} />
                              </span>
                              <span className="mt-3 block text-sm font-black text-slate-950">
                                Add product video
                              </span>
                              <span className="mt-1 block text-xs font-semibold text-slate-500">
                                Optional video for this color.
                              </span>
                            </span>

                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) =>
                                onVideoChange(v.id, e.target.files?.[0] || null)
                              }
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {preview ? (
        <div
          className="fixed inset-0 z-[1000] grid place-items-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setPreview(null)}
        >
          <div
            className="grid w-full max-w-5xl gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 text-white">
              <p className="truncate rounded-full bg-white/10 px-3 py-2 text-sm font-bold backdrop-blur">
                {preview.label}
              </p>

              <button
                type="button"
                aria-label="Close full view"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/70 bg-white text-black shadow-lg transition hover:scale-105"
                onClick={() => setPreview(null)}
              >
                <X size={18} strokeWidth={2.6} />
              </button>
            </div>

            {preview.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.src}
                alt={preview.label}
                className="max-h-[82vh] w-full rounded-[4px] bg-black object-contain shadow-[0_24px_80px_rgba(0,0,0,0.4)]"
              />
            ) : (
              <video
                src={preview.src}
                controls
                autoPlay
                className="max-h-[82vh] w-full rounded-[4px] bg-black object-contain shadow-[0_24px_80px_rgba(0,0,0,0.4)]"
              />
            )}
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .variant-step {
          animation: variantStepIn 260ms ease-out;
        }

        @keyframes variantStepIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .variant-card {
          position: relative;
        }

        .variant-card::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: inherit;
          background: linear-gradient(
            135deg,
            rgba(245, 158, 11, 0.08),
            transparent 30%,
            rgba(15, 23, 42, 0.035)
          );
          opacity: 0;
          transition: opacity 320ms ease;
        }

        .variant-card:hover::before {
          opacity: 1;
        }

        .variant-media-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
          overscroll-behavior: contain;
        }

        .variant-media-scroll::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }

        @media (prefers-reduced-motion: reduce) {
          .variant-step,
          .variant-card,
          .variant-card::before,
          .variant-card *,
          .variant-media-scroll {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
}