"use client";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onBack?: () => void;
};

const IconSearch = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export default function SearchBar({ value, onChange, onSubmit, onBack }: Props) {
  return (
    <div className="flex items-center gap-2 border border-black/15 rounded-[5px] px-3 py-2 bg-white">
      {onBack && (
        <button className="btn btn-ghost !p-2" onClick={onBack} aria-label="Back to previous">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit();
        }}
        placeholder="Search products..."
        className="flex-1 outline-none text-sm"
      />
      {value && (
        <button className="btn btn-ghost !p-2" aria-label="Clear search" onClick={() => onChange("")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
      <button className="btn btn-primary !py-2 !px-3" onClick={onSubmit}>
        <IconSearch />
      </button>
    </div>
  );
}
