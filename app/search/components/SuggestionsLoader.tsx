"use client";

export default function SuggestionsLoader({ rows = 6 }: { rows?: number }) {
  return (
    <div className="border-b border-t border-black/10 bg-white text-sm divide-y divide-black/5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="w-full flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-4 h-4 rounded-full bg-black/10 animate-pulse" />
            <div className="h-3 w-2/3 bg-black/10 rounded-[3px] animate-pulse" />
          </div>
          <div className="h-3 w-12 bg-black/10 rounded-[3px] animate-pulse" />
        </div>
      ))}
    </div>
  );
}
