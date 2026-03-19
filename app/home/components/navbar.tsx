"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getUserToken } from "../../utils/auth";
const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Pure Fire";
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

const IconChevron = ({ open }: { open: boolean }) => (
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

type CategoryNode = {
  _id: string;
  name: string;
  children?: CategoryNode[];
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function HomeNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);
  const [expandedRoot, setExpandedRoot] = useState<string | null>(null);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
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

  useEffect(() => {
    const loadCartCount = async () => {
      const cartId = localStorage.getItem("cart_id") || "";
      if (!cartId) {
        setCartCount(0);
        return;
      }
      try {
        const res = await fetch("/api/user/get-user-cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cart_id: cartId }),
        });
        const data = await res.json();
        const count = (data?.items || []).reduce((sum: number, i: any) => sum + Number(i.qty || 1), 0);
        setCartCount(count);
      } catch {
        setCartCount(0);
      }
    };
    loadCartCount();
    const onUpdated = () => loadCartCount();
    window.addEventListener("focus", onUpdated);
    window.addEventListener("cart:updated", onUpdated as EventListener);
    return () => {
      window.removeEventListener("focus", onUpdated);
      window.removeEventListener("cart:updated", onUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const [treeRes, productsRes] = await Promise.all([
          fetch("/api/admin/categories/tree", { cache: "no-store" }),
          fetch("/api/admin/get-products", { cache: "no-store" }),
        ]);
        const treeData = await treeRes.json();
        const productsData = await productsRes.json();
        const products = (productsData?.products || []).filter(
          (p: any) => !p.status || p.status === "published",
        );
        const usedIds = new Set(
          products
            .map((p: any) => String(p.catagory_id?._id || p.catagory_id || ""))
            .filter(Boolean),
        );
        const prune = (node: CategoryNode): CategoryNode | null => {
          const kids = (node.children || [])
            .map(prune)
            .filter(Boolean) as CategoryNode[];
          const hasDirect = usedIds.has(String(node._id));
          if (!hasDirect && kids.length === 0) return null;
          return { ...node, children: kids };
        };
        const filtered = (treeData?.categories || [])
          .map(prune)
          .filter(Boolean) as CategoryNode[];
        setCategoryTree(filtered);
      } catch {
        setCategoryTree([]);
      }
    };
    loadCategories();
  }, []);

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
          <a className="text-lg font-semibold tracking-tight" href="/">{siteName}</a>
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
            <button className="btn btn-ghost cursor-pointer !p-2 relative" aria-label="Cart" onClick={() => router.push("/cart")}>
              <IconCart />
              {cartCount > 0 && (
                <span className="absolute top-1 right-0.5 w-2.5 h-2.5 rounded-full bg-black border border-white" />
              )}
            </button>
            <button
              className="btn btn-ghost cursor-pointer !p-2"
              aria-label="Profile"
              onClick={() => {
                const token = getUserToken();
                router.push(token ? "/profile" : "/login?next=/profile");
              }}
            >
              <IconUser />
            </button>
            <button className="btn btn-ghost cursor-pointer !p-2" aria-label="24x7 Support" onClick={() => router.push("/support")}>
              <IconSupport />
            </button>
          </div>
        ) : (
          <div className="w-12" aria-hidden />
        )}
      </div>

      {/* Slide-in menu */}
      <div
        className={`fixed inset-0 z-20 transition-opacity duration-200 ${menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        onClick={() => setMenuOpen(false)}
      >
        <div
          className={`absolute top-0 left-0 h-full w-64 bg-white border-r border-black/10 transition-transform duration-200 ${menuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-3 border-b border-black/10 p-4 pb-2 font-semibold">
            <h3>{siteName}</h3>
            <button className="cursor-pointer !p-2" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
              <IconClose />
            </button>
          </div>
          <nav className="grid gap-2 px-4 pt-2 text-sm">
            {categoryTree.map((root) => {
              const openRoot = expandedRoot === root._id;
              return (
                <div key={root._id} className="border-b border-black/10 pb-2">
                  <button
                    className="w-full cursor-pointer flex items-center justify-between py-2 text-left"
                    onClick={() => {
                      const next = openRoot ? null : root._id;
                      setExpandedRoot(next);
                      setExpandedSub(null);
                    }}
                  >
                    <span>{root.name}</span>
                    <IconChevron open={openRoot} />
                  </button>
                  {openRoot && (
                    <div className="pl-3 grid gap-1">
                      {root.children?.map((sub) => {
                        const openSub = expandedSub === sub._id;
                        return (
                          <div key={sub._id} className="border-l border-black/10 pl-2">
                            <button
                              className="w-full cursor-pointer flex items-center justify-between py-1 text-left"
                              onClick={() => setExpandedSub(openSub ? null : sub._id)}
                            >
                              <span>{sub.name}</span>
                              <IconChevron open={openSub} />
                            </button>
                            {openSub && sub.children?.length ? (
                              <div className="pl-3 grid gap-1">
                                {sub.children.map((child) => (
                                  <button
                                    key={child._id}
                                    className="py-1 text-left cursor-pointer text-black border-b border-t border-black/10 hover:text-black"
                                    onClick={() => {
                                      setMenuOpen(false);
                                      router.push(
                                        `/collections/${slugify(child.name)}?category=${encodeURIComponent(root.name)}&sub=${encodeURIComponent(sub.name)}&child=${encodeURIComponent(child.name)}`
                                      );
                                    }}
                                  >
                                    {child.name}
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {categoryTree.length === 0 && <div className="text-xs text-[var(--muted)]">No categories</div>}
            <div className="border-black/10 grid gap-2">
              <a className="py-2 border-b border-black/10" href="/wishlist">Wishlist</a>
              <a className="py-2 border-b border-black/10" href="/orders">Orders</a>
              <a className="py-2 border-b border-black/10" href="/return-exchange-policy">Return & Exchange Policy</a>
              <a className="py-2 border-b border-black/10" href="/support">Support</a>
            </div>
          </nav>
          <div className="absolute bottom-0 right-0 mt-auto px-4 py-5">
            <div className="flex items-center justify-center gap-1 text-[#f59e0b]">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.1 6.6L12 17.8 6.2 20.6l1.1-6.6L2.5 9.4l6.6-.9L12 2.5z" />
                </svg>
              ))}
            </div>
            <p className="text-center text-sm font-extrabold tracking-[0.12em] mt-3">
              LOVED BY 7,00,000+ CUSTOMERS
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}


