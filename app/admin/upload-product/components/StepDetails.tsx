"use client";

import { Plus, X, FileText, ListChecks } from "lucide-react";
import { FieldRenderer, Highlight } from "./types";
import RichTextEditor from "./RichTextEditor";

export default function StepDetails({
  renderInput,
  keyHighlights,
  setKeyHighlights,
  min,
  max,
  description,
  setDescription,
}: {
  renderInput: FieldRenderer;
  keyHighlights: Highlight[];
  setKeyHighlights: (v: Highlight[]) => void;
  min: number;
  max: number;
  description: string;
  setDescription: (html: string) => void;
}) {
  const updateHighlight = (
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    setKeyHighlights(
      keyHighlights.map((h, i) => (i === index ? { ...h, [field]: value } : h)),
    );
  };

  const addRow = () => {
    if (keyHighlights.length >= max) return;
    setKeyHighlights([...keyHighlights, { key: "", value: "" }]);
  };

  const removeRow = (index: number) => {
    if (keyHighlights.length <= min) return;
    setKeyHighlights(keyHighlights.filter((_, i) => i !== index));
  };

  return (
    <section className="step-details grid gap-5">
      <div className="rounded-[4px] border border-black/10 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[4px] border border-black/10 bg-white text-slate-950 shadow-sm">
            <FileText size={18} strokeWidth={2.4} />
          </span>

          <div className="min-w-0">
            <h2 className="text-base font-black tracking-[-0.02em] text-slate-950">
              Product details
            </h2>
            <p className="mt-1 text-sm font-medium leading-5 text-[var(--muted)]">
              Add product name and a proper rich description for the storefront.
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {renderInput("name", "Product name", "Urban Flex Jeans")}

          <div className="grid gap-2">
            <div className="flex items-end justify-between gap-3">
              <div>
                <span className="label m-0">Description</span>
                <p className="mt-1 text-xs font-medium text-[var(--muted)]">
                  Fabric, fit, care, shipping and product usage details.
                </p>
              </div>
            </div>

            <div className="rich-editor-shell rounded-[4px] border border-black/10 bg-white shadow-sm transition focus-within:border-slate-950 focus-within:ring-4 focus-within:ring-slate-950/5">
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Describe fabric, fit, care, shipping, etc."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[4px] border border-black/10 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[4px] border border-black/10 bg-white text-slate-950 shadow-sm">
              <ListChecks size={18} strokeWidth={2.4} />
            </span>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-black tracking-[-0.02em] text-slate-950">
                  Key highlights
                </h2>

                <span className="rounded-full border border-black/10 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                  {keyHighlights.length}/{max}
                </span>
              </div>

              <p className="mt-1 text-sm font-medium leading-5 text-[var(--muted)]">
                Add short product facts like fabric, fit, pattern, sleeve or
                occasion.
              </p>

              <p className="mt-1 text-xs font-medium text-slate-400">
                Minimum {min}, maximum {max} highlights required.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[4px] bg-slate-950 px-4 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-black active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
            onClick={addRow}
            disabled={keyHighlights.length >= max}
          >
            <Plus size={16} strokeWidth={2.8} />
            Add
          </button>
        </div>

        <div className="grid gap-3">
          {keyHighlights.map((item, idx) => (
            <div
              key={idx}
              className="highlight-row grid gap-2 rounded-[4px] border border-black/10 bg-white p-2 transition hover:border-black/20 hover:shadow-sm sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)_auto] sm:items-center"
            >
              <label className="grid gap-1">
                <span className="px-1 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                  Key
                </span>

                <input
                  className="h-11 rounded-[4px] border border-black/10 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5"
                  placeholder="Fabric"
                  value={item.key}
                  onChange={(e) => updateHighlight(idx, "key", e.target.value)}
                />
              </label>

              <label className="grid gap-1">
                <span className="px-1 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                  Value
                </span>

                <input
                  className="h-11 rounded-[4px] border border-black/10 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5"
                  placeholder="100% Cotton"
                  value={item.value}
                  onChange={(e) => updateHighlight(idx, "value", e.target.value)}
                />
              </label>

              <button
                type="button"
                className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-[4px] border border-red-200 bg-white px-3 text-sm font-black text-red-600 transition hover:border-red-600 hover:bg-red-600 hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-red-200 disabled:hover:bg-white disabled:hover:text-red-600 sm:mt-[18px]"
                onClick={() => removeRow(idx)}
                disabled={keyHighlights.length <= min}
                aria-label={`Remove highlight ${idx + 1}`}
              >
                <X size={16} strokeWidth={2.8} />
                <span className="sm:hidden lg:inline">Remove</span>
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-[4px] border border-dashed border-black/10 px-3 py-2 text-xs font-medium leading-5 text-[var(--muted)]">
          Example: <b className="text-slate-700">Fabric</b> — 100% Cotton,
          <b className="ml-1 text-slate-700">Fit</b> — Regular Fit,
          <b className="ml-1 text-slate-700">Occasion</b> — Casual Wear.
        </div>
      </div>

      <style jsx>{`
        .step-details {
          animation: detailsIn 220ms ease-out;
        }

        @keyframes detailsIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .rich-editor-shell :global(.ProseMirror),
        .rich-editor-shell :global([contenteditable="true"]) {
          min-height: 180px;
        }

        .highlight-row {
          position: relative;
        }

        @media (prefers-reduced-motion: reduce) {
          .step-details,
          .highlight-row,
          .step-details * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
}