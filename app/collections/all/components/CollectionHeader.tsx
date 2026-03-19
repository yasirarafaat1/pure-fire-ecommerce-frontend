"use client";

import React from "react";

type Props = {
  collectionTitle: string;
  sortOptions: string[];
  activeSort: string;
  onSortChange: (value: string) => void;
  onOpenFilters: () => void;
};

export default function CollectionHeader({
  collectionTitle,
  sortOptions,
  activeSort,
  onSortChange,
  onOpenFilters,
}: Props) {
  return (
    <header className="grid gap-3 max-w-full overflow-x-hidden">
      <h1 className="text-md font-semibold">{collectionTitle}</h1>
      <div className="flex items-center gap-4 text-sm border-b border-black/10 pb-2 max-w-full min-w-0">
        <span className="text-[var(--muted)] pb-2 shrink-0">Sort By</span>
        <div className="flex-1 overflow-x-auto snap-x snap-mandatory scroll-smooth min-w-0">
          <div className="flex gap-4 min-w-max whitespace-nowrap">
            {sortOptions.map((opt) => {
              const active = activeSort === opt;
              return (
                <button
                  key={opt}
                  className={`px-1 pb-2 border-b-2 cursor-pointer ${
                    active ? "border-black text-black font-semibold" : "border-transparent text-[var(--muted)]"
                  }`}
                  onClick={() => onSortChange(opt)}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
        <button className="inline-flex md:!hidden btn btn-ghost px-3 py-1 shrink-0" onClick={onOpenFilters}>
          Filter
        </button>
      </div>
    </header>
  );
}
