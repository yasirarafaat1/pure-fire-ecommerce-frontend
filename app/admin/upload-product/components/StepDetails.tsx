"use client";

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
  const updateHighlight = (index: number, field: "key" | "value", value: string) => {
    setKeyHighlights(
      keyHighlights.map((h, i) => (i === index ? { ...h, [field]: value } : h))
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
    <section className="grid gap-4">
      <div className="grid gap-3">
        {renderInput("name", "Product name", "Urban Flex Jeans")}
        <div className="grid gap-2">
          <span className="label">Description (rich text)</span>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="Describe fabric, fit, care, shipping, etc."
          />
        </div>
      </div>

      <div className="card p-4 bg-white/60 border border-black/5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="label m-0">Key highlights (key & value, {min}-{max})</p>
            <p className="text-xs text-[var(--muted)]">Example: Key "Fabric", Value "100% Cotton".</p>
          </div>
          <button className="btn btn-primary" onClick={addRow} disabled={keyHighlights.length >= max}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Add
          </button>
        </div>
        <div className="grid gap-2">
          {keyHighlights.map((item, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <input
                className="input"
                placeholder="Key e.g. Fabric"
                value={item.key}
                onChange={(e) => updateHighlight(idx, "key", e.target.value)}
              />
              <input
                className="input"
                placeholder="Value e.g. 100% Cotton"
                value={item.value}
                onChange={(e) => updateHighlight(idx, "value", e.target.value)}
              />
              <button
                className="btn btn-ghost"
                onClick={() => removeRow(idx)}
                disabled={keyHighlights.length <= min}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

