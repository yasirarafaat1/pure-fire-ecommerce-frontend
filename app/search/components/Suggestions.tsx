"use client";

type Suggestion = { label: string; sub?: string };

type Props = {
  items: Suggestion[];
  onSelect: (label: string) => void;
};

export default function Suggestions({ items, onSelect }: Props) {
  if (!items.length) return null;
  return (
    <div className="border border-black/10 rounded-[5px] bg-white text-sm divide-y divide-black/5">
      {items.map((s) => (
        <button
          key={s.label}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-black/5 text-left"
          onClick={() => onSelect(s.label)}
        >
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            {s.label}
          </span>
          {s.sub && <span className="text-[var(--muted)]">{s.sub}</span>}
        </button>
      ))}
    </div>
  );
}
