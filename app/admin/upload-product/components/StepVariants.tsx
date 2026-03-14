"use client";

import { VariantForm, blankVariant } from "./variant-utils";

type Props = { variants: VariantForm[]; setVariants: (next: VariantForm[]) => void; sku: string; setSku: (v: string) => void };

export default function StepVariants({ variants, setVariants, sku, setSku }: Props) {
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
        if (idx < files.length) {
          files.splice(idx, 1);
          // also remove its preview
          if (previews[idx]) previews.splice(idx, 1);
        } else {
          const pIdx = idx - files.length;
          if (pIdx >= 0 && pIdx < previews.length) previews.splice(pIdx, 1);
        }
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

      <div className="grid gap-4">
        {variants.map((v, idx) => (
          <div key={v.id} className="border border-black/10 rounded-[5px] p-4 grid gap-4 bg-white">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex flex-wrap items-center justify gap-2">
                <span className="pill">{idx + 1}</span>
                <label className="flex items-center gap-2">
                  <span className="text-sm text-[var(--muted)]">Color</span>
                  <input
                    id={`color-picker-${v.id}`}
                    type="color"
                    className="h-10 w-10 border border-black/20 rounded-[5px] bg-white"
                    value={v.color || "#000000"}
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
                      const picker = document.querySelector<HTMLInputElement>(`#color-picker-${v.id}`);
                      if (picker) picker.value = upper;
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
              <div className="grid gap-2">
                <label className="label">Images (min 5, max 10)</label>
                <input type="file" accept="image/*" multiple className="input" onChange={(e) => onImagesChange(v.id, e.target.files)} />
                <div className="text-xs text-[var(--muted)]">{v.imagesFiles.length} selected. First image becomes cover.</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {(v.imagePreviews || []).map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="preview" className="w-full aspect-[4/3] object-cover rounded" />
                      <button
                        type="button"
                        className="absolute top-1 right-1 text-xs bg-red-600 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100"
                        onClick={() => removeImage(v.id, i)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <label className="label">Video (exactly 1)</label>
                <input type="file" accept="video/*" className="input" onChange={(e) => onVideoChange(v.id, e.target.files?.[0] || null)} />
                {v.videoPreview && (
                  <div className="relative">
                    <video className="w-full rounded border border-black/10" controls src={v.videoPreview}>
                      preview
                    </video>
                    <button
                      type="button"
                      className="absolute top-1 right-1 text-xs bg-red-600 text-white px-2 py-1 rounded"
                      onClick={() => removeVideo(v.id)}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
