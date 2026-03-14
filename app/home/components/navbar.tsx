"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const IconArrowLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const IconMenu = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const IconClose = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconSearch = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconCart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61H19a2 2 0 0 0 2-1.61L22 6H6" />
  </svg>
);

const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconSupport = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {/* Headset shell */}
    <path d="M5 12.5V11a7 7 0 0 1 14 0v1.5" />
    <rect x="3.5" y="11" width="3" height="6" rx="1.2" />
    <rect x="17.5" y="11" width="3" height="6" rx="1.2" />
    {/* Mic boom */}
    <path d="M17 17.5c0 1.4-1.1 2.5-2.5 2.5H13" />
    <circle cx="12" cy="6.5" r="0.6" fill="currentColor" />
    {/* Tiny 24/7 badge */}
    <g transform="translate(12.5 12)">
      <circle cx="4.5" cy="4.5" r="4.5" fill="currentColor" opacity="0.12" />
      <path d="M5.4 4.5h-2c0-1 .9-1.1 2-2.2v0" strokeWidth="1.2" />
      <path d="M3.4 6.3h2.2" strokeWidth="1.2" />
    </g>
  </svg>
);

export default function HomeNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchText, setSearchText] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/search")) {
      setSearchMode(true);
    } else {
      setSearchMode(false);
      setSearchText("");
    }
  }, [pathname]);

  const toggleMenu = () => setMenuOpen((v) => !v);

  const startSearch = () => {
    setSearchMode(true);
    setMenuOpen(false);
    router.push("/search");
  };

  const backFromSearch = () => {
    setSearchMode(false);
    setSearchText("");
    router.back();
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-black/10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Left cluster */}
        <div className="flex items-center gap-3">
          {!searchMode && (
            <>
              <button className="btn btn-ghost !p-2" onClick={toggleMenu} aria-label="Menu">
                {menuOpen ? <IconClose /> : <IconMenu />}
              </button>
              <button className="btn btn-ghost !p-2" onClick={startSearch} aria-label="Search">
                <IconSearch />
              </button>
            </>
          )}
          {searchMode && (
            <button className="btn btn-ghost !p-2" onClick={backFromSearch} aria-label="Back">
              <IconArrowLeft />
            </button>
          )}
        </div>

        {/* Center logo / search */}
        {!searchMode ? (
          <a className="text-lg font-semibold tracking-tight" href="/">Pure Fire</a>
        ) : (
          <div className="flex-1 flex max-w-md w-full items-center gap-2">
            <input
              autoFocus
              className="input w-full"
              placeholder="Search products..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") router.push(`/search?q=${encodeURIComponent(searchText || (e.target as HTMLInputElement).value)}`);
              }}
            />
            {searchText && (
              <button className="btn btn-ghost !p-2" aria-label="Clear search" onClick={() => setSearchText("")}>
                <IconClose />
              </button>
            )}
          </div>
        )}

        {/* Right cluster */}
        {!searchMode ? (
          <div className="flex items-center gap-3">
            <button className="btn btn-ghost !p-2" aria-label="Cart">
              <IconCart />
            </button>
            <button className="btn btn-ghost !p-2" aria-label="Login">
              <IconUser />
            </button>
            <button className="btn btn-ghost !p-2" aria-label="24x7 Support">
              <IconSupport />
            </button>
          </div>
        ) : (
          <div className="w-12" aria-hidden />
        )}
      </div>

      {/* Slide-in menu */}
      <div
        className={`fixed inset-0 z-20 transition-opacity duration-200 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMenuOpen(false)}
      >
        <div
          className={`absolute top-0 left-0 h-full w-64 bg-white border-r border-black/10 transition-transform duration-200 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 font-semibold">Menu</div>
          <nav className="grid gap-2 px-4 pb-6 text-sm">
            <a className="py-2 border-b border-black/10" href="/">Home</a>
            <a className="py-2 border-b border-black/10" href="/collections">Collections</a>
            <a className="py-2 border-b border-black/10" href="/offers">Offers</a>
            <a className="py-2 border-b border-black/10" href="/support">Support</a>
          </nav>
        </div>
      </div>
    </header>
  );
}
