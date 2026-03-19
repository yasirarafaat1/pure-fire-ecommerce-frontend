"use client";

import { FaStar } from "react-icons/fa";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
import { AvailableFilters, FiltersState } from "./collections-types";

const IconClose = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

type Props = {
  openSections: Record<string, boolean>;
  toggle: (key: string) => void;
  pendingFilters: FiltersState;
  availableFilters: AvailableFilters;
  priceBounds: { min: number; max: number };
  onSetPriceMin: (val: number) => void;
  onSetPriceMax: (val: number) => void;
  onSetPriceRange: (val: number) => void;
  toggleValue: <T,>(key: keyof FiltersState, value: T) => void;
  hasSelections: boolean;
  onApply: () => void;
  onClear: () => void;
  onClose?: () => void;
};

export default function CollectionFilters({
  openSections,
  toggle,
  pendingFilters,
  availableFilters,
  priceBounds,
  onSetPriceMin,
  onSetPriceMax,
  onSetPriceRange,
  toggleValue,
  hasSelections,
  onApply,
  onClear,
  onClose,
}: Props) {
  return (
    <>
      <style jsx>{`
        @media (min-width: 768px) {
          .mobile-only {
            display: none !important;
          }
        }
      `}</style>
      <div className="flex items-center justify-between border-b border-black/10 pb-3 mb-3">
        <h3 className="text-lg font-semibold">Filters</h3>
        <button className="mobile-only btn btn-ghost px-3 py-1" onClick={onClose}>
          <IconClose />
        </button>
      </div>

      <div className="grid gap-2 border-b border-black/10 pb-3">
        <button className="w-full cursor-pointer flex items-center justify-between text-left" onClick={() => toggle("category")}>
          <span className="text-sm font-semibold">Categories</span>
          <span className="text-[var(--muted)]">{openSections.category ? <IoChevronUp /> : <IoChevronDown />}</span>
        </button>
        {openSections.category && (
          <div className="grid gap-1 text-sm">
            {availableFilters.categories.map((c) => (
              <label key={c} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-black" checked={pendingFilters.categories.includes(c)} onChange={() => toggleValue("categories", c)} />
                <span>{c}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-3 border-b border-black/10 pb-3">
        <button className="w-full cursor-pointer flex items-center justify-between text-left" onClick={() => toggle("price")}>
          <span className="text-sm font-semibold">Price</span>
          <span className="text-[var(--muted)]">{openSections.price ? <IoChevronUp /> : <IoChevronDown />}</span>
        </button>
        {openSections.price && (
          <div className="grid gap-3">
            <input
              type="range"
              className="accent-black cursor-pointer"
              min={priceBounds.min}
              max={priceBounds.max}
              value={pendingFilters.price.max}
              onChange={(e) => onSetPriceRange(Number(e.target.value))}
            />
            <div className="flex items-center gap-2 text-sm">
              <div className="flex-1 border border-black/20 rounded-[5px] px-3 py-2 flex items-center gap-2">
                <span>&#8377;</span>
                <input
                  className="w-full outline-none"
                  type="number"
                  value={pendingFilters.price.min}
                  onChange={(e) => onSetPriceMin(Number(e.target.value))}
                />
              </div>
              <span>to</span>
              <div className="flex-1 border border-black/20 rounded-[5px] px-3 py-2 flex items-center gap-2">
                <span>&#8377;</span>
                <input
                  className="w-full outline-none"
                  type="number"
                  value={pendingFilters.price.max}
                  onChange={(e) => onSetPriceMax(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-2 border-b border-black/10 pb-3">
        <button className="w-full cursor-pointer flex items-center justify-between text-left" onClick={() => toggle("color")}>
          <span className="text-sm font-semibold">Color</span>
          <span className="text-[var(--muted)]">{openSections.color ? <IoChevronUp /> : <IoChevronDown />}</span>
        </button>
        {openSections.color && (
          <div className="flex flex-wrap gap-2">
            {availableFilters.colors.map((c) => (
              <button
                key={c}
                className={`w-7 h-7 cursor-pointer rounded-full border ${pendingFilters.colors.includes(c) ? "border-black" : "border-black/20"}`}
                style={{ background: c }}
                onClick={() => toggleValue("colors", c)}
                aria-label={c}
              />
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-2 border-b border-black/10 pb-3">
        <button className="w-full cursor-pointer flex items-center justify-between text-left" onClick={() => toggle("size")}>
          <span className="text-sm font-semibold">Size</span>
          <span className="text-[var(--muted)]">{openSections.size ? <IoChevronUp /> : <IoChevronDown />}</span>
        </button>
        {openSections.size && (
          <div className="flex flex-wrap gap-2">
            {availableFilters.sizes.map((s) => (
              <button
                key={s}
                className={`px-3 py-1 cursor-pointer border rounded-[5px] text-xs ${pendingFilters.sizes.includes(s) ? "border-black" : "border-black/20"}`}
                onClick={() => toggleValue("sizes", s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-2 border-b border-black/10 pb-3">
        <button className="w-full cursor-pointer flex items-center justify-between text-left" onClick={() => toggle("fabric")}>
          <span className="text-sm font-semibold">Fabric</span>
          <span className="text-[var(--muted)]">{openSections.fabric ? <IoChevronUp /> : <IoChevronDown />}</span>
        </button>
        {openSections.fabric && (
          <div className="grid gap-1 text-sm">
            {availableFilters.fabrics.map((f) => (
              <label key={f} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-black cursor-pointer" checked={pendingFilters.fabrics.includes(f)} onChange={() => toggleValue("fabrics", f)} />
                <span>{f}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-2 border-b border-black/10 pb-3">
        <button className="w-full cursor-pointer flex items-center justify-between text-left" onClick={() => toggle("discount")}>
          <span className="text-sm font-semibold">Discount</span>
          <span className="text-[var(--muted)]">{openSections.discount ? <IoChevronUp /> : <IoChevronDown />}</span>
        </button>
        {openSections.discount && (
          <div className="grid gap-1 text-sm">
            {availableFilters.discounts.map((d) => (
              <label key={d} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-black cursor-pointer" checked={pendingFilters.discounts.includes(d)} onChange={() => toggleValue("discounts", d)} />
                <span>{d}%</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-2 border-b border-black/10 pb-3">
        <button className="w-full cursor-pointer flex items-center justify-between text-left" onClick={() => toggle("rating")}>
          <span className="text-sm font-semibold">Rating</span>
          <span className="text-[var(--muted)]">{openSections.rating ? <IoChevronUp /> : <IoChevronDown />}</span>
        </button>
        {openSections.rating && (
          <div className="grid gap-1 text-sm">
            {availableFilters.ratings.map((r) => (
              <label key={r} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-black cursor-pointer" checked={pendingFilters.ratings.includes(r)} onChange={() => toggleValue("ratings", r)} />
                <span className="flex items-center gap-1">
                  {r}
                  <FaStar className="text-[#000]" />
                  <span>&amp; above</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <button className="btn btn-primary flex-1" disabled={!hasSelections} onClick={onApply}>
          Apply
        </button>
        <button className="btn btn-ghost flex-1" disabled={!hasSelections} onClick={onClear}>
          Clear
        </button>
      </div>
    </>
  );
}
