export const IconArrowLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

export const IconMenu = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

export const IconClose = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const IconSearch = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const IconCart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61H19a2 2 0 0 0 2-1.61L22 6H6" />
  </svg>
);

export const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const IconSupport = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5V11a7 7 0 0 1 14 0v1.5" />
    <rect x="3.5" y="11" width="3" height="6" rx="1.2" />
    <rect x="17.5" y="11" width="3" height="6" rx="1.2" />
    <path d="M17 17.5c0 1.4-1.1 2.5-2.5 2.5H13" />
    <circle cx="12" cy="6.5" r="0.6" fill="currentColor" />
    <g transform="translate(12.5 12)">
      <circle cx="4.5" cy="4.5" r="4.5" fill="currentColor" opacity="0.12" />
      <path d="M5.4 4.5h-2c0-1 .9-1.1 2-2.2v0" strokeWidth="1.2" />
      <path d="M3.4 6.3h2.2" strokeWidth="1.2" />
    </g>
  </svg>
);

export const IconChevron = ({ open }: { open: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`transition-transform ${open ? "rotate-180" : "rotate-0"}`}
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const RatingStars = () => (
  <div className="flex items-center justify-center gap-1 text-[#f59e0b]">
    {Array.from({ length: 5 }).map((_, i) => (
      <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.1 6.6L12 17.8 6.2 20.6l1.1-6.6L2.5 9.4l6.6-.9L12 2.5z" />
      </svg>
    ))}
  </div>
);
