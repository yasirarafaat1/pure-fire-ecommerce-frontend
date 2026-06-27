"use client";

import { useEffect, useMemo, useState } from "react";
import { cachedFetch } from "../../utils/cachedFetch";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getUserToken } from "../../utils/auth";
import {
  defaultPublicSettings,
  fetchPublicSettings,
} from "../../utils/public-settings";
import {
  IconArrowLeft,
  IconCart,
  IconChevron,
  IconClose,
  IconMenu,
  IconSearch,
  IconSupport,
  IconUser,
  RatingStars,
} from "./navbar-icons";

type CategoryNode = {
  _id: string;
  name: string;
  children?: CategoryNode[];
};

type CartItem = {
  qty?: number | string;
};

type ProductSummary = {
  status?: string;
  catagory_id?: string | { _id?: string };
};

type Props = {
  onOpenCart?: () => void;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function HomeNavbar({ onOpenCart }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);
  const [siteName, setSiteName] = useState(defaultPublicSettings.storeName);
  const [expandedRoot, setExpandedRoot] = useState<string | null>(null);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  const searchMode = useMemo(() => pathname.startsWith("/search"), [pathname]);

  useEffect(() => {
    fetchPublicSettings()
      .then((settings) => setSiteName(settings.storeName))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [menuOpen]);

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
        const items = (data?.items || []) as CartItem[];

        const count = items.reduce(
          (sum, item) => sum + Number(item.qty || 1),
          0,
        );

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
          cachedFetch("/api/admin/categories/tree", undefined, 600000, true),
          cachedFetch("/api/admin/get-products", undefined, 600000, true),
        ]);

        const treeData = await treeRes.json();
        const productsData = await productsRes.json();

        const products = (
          (productsData?.products || []) as ProductSummary[]
        ).filter(
          (product) => !product.status || product.status === "published",
        );

        const usedIds = new Set(
          products
            .map((product) =>
              String(
                typeof product.catagory_id === "object"
                  ? product.catagory_id?._id || ""
                  : product.catagory_id || "",
              ),
            )
            .filter(Boolean),
        );

        const prune = (node: CategoryNode): CategoryNode | null => {
          const kids = (node.children || [])
            .map(prune)
            .filter(Boolean) as CategoryNode[];

          const hasDirect = usedIds.has(String(node._id));

          if (!hasDirect && kids.length === 0) return null;

          return {
            ...node,
            children: kids,
          };
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

  const closeMenu = () => {
    setMenuOpen(false);
    setExpandedRoot(null);
    setExpandedSub(null);
  };

  const startSearch = () => {
    closeMenu();
    router.push("/search");
  };

  const backFromSearch = () => {
    router.back();
  };

  const goToProfile = () => {
    const token = getUserToken();
    router.push(token ? "/profile" : "/login?next=/profile");
  };

  const goToCategory = ({
    root,
    sub,
    child,
  }: {
    root: string;
    sub?: string;
    child?: string;
  }) => {
    closeMenu();

    const targetName = child || sub || root;
    const params = new URLSearchParams();

    params.set("category", root);

    if (sub) params.set("sub", sub);
    if (child) params.set("child", child);

    router.push(`/collections/${slugify(targetName)}?${params.toString()}`);
  };

  return (
    <>
      <style jsx>{`
        @keyframes navShine {
          0% {
            transform: translateX(-150%) rotate(18deg);
            opacity: 0;
          }
          15% {
            opacity: 0.75;
          }
          80% {
            opacity: 0.75;
          }
          100% {
            transform: translateX(170%) rotate(18deg);
            opacity: 0;
          }
        }

        @keyframes cartBadgePulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.08);
          }
        }

        .nav-icon-button {
          position: relative;
          isolation: isolate;
          overflow: hidden;
        }

        .nav-icon-button::before {
          content: "";
          position: absolute;
          inset: 2px;
          z-index: 0;
          border-radius: 9999px;
          background:
            radial-gradient(circle at 30% 18%, rgba(255, 255, 255, 0.32), transparent 36%),
            linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0));
          opacity: 0;
          transform: scale(0.72);
          transition:
            opacity 360ms ease,
            transform 360ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .nav-icon-button::after {
          content: "";
          position: absolute;
          top: -35%;
          left: -55%;
          z-index: 1;
          height: 170%;
          width: 42%;
          border-radius: 9999px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.52),
            transparent
          );
          opacity: 0;
          pointer-events: none;
        }

        .nav-icon-button:hover {
          border-color: rgba(0, 0, 0, 0.28);
          background: #090909;
          color: #ffffff;
          box-shadow:
            0 12px 30px rgba(0, 0, 0, 0.16),
            inset 0 0 0 1px rgba(255, 255, 255, 0.08);
        }

        .nav-icon-button:hover::before {
          opacity: 1;
          transform: scale(1);
        }

        .nav-icon-button:hover::after {
          animation: navShine 900ms ease-in-out forwards;
        }

        .nav-icon-button:focus-visible {
          outline: none;
          box-shadow:
            0 0 0 3px rgba(0, 0, 0, 0.12),
            0 12px 30px rgba(0, 0, 0, 0.16);
        }

        .nav-icon-glyph {
          position: relative;
          z-index: 2;
          display: inline-flex;
          transition:
            transform 380ms cubic-bezier(0.22, 1, 0.36, 1),
            opacity 260ms ease;
        }
.nav-icon-glyph svg {
  overflow: visible;
}

.nav-icon-glyph {
  position: relative;
  z-index: 2;
  display: inline-flex;
  transition:
    transform 420ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 260ms ease;
}

/* Menu: lines reshift, no rotate */
.nav-menu-button:hover .nav-icon-glyph {
  transform: scale(1.04);
}

.nav-menu-button:hover .nav-icon-glyph svg > *:nth-child(1) {
  transform: translateX(-2.5px);
}

.nav-menu-button:hover .nav-icon-glyph svg > *:nth-child(2) {
  transform: translateX(3px);
}

.nav-menu-button:hover .nav-icon-glyph svg > *:nth-child(3) {
  transform: translateX(-1.5px);
}

/* Search: lens slight focus, no jump */
.nav-search-button:hover .nav-icon-glyph {
  transform: scale(1.05);
}

.nav-search-button:hover .nav-icon-glyph svg > *:nth-child(1) {
  transform: scale(1.04);
}

.nav-search-button:hover .nav-icon-glyph svg > *:nth-child(2) {
  transform: translate(1.5px, 1.5px);
}

/* Cart: basket smooth reshift */
.nav-cart-button:hover .nav-icon-glyph {
  transform: scale(1.045);
}

.nav-cart-button:hover .nav-icon-glyph svg > *:nth-child(1) {
  transform: translateX(-1.5px);
}

.nav-cart-button:hover .nav-icon-glyph svg > *:nth-child(2) {
  transform: translateX(2px);
}

.nav-cart-button:hover .nav-icon-glyph svg > *:nth-child(3) {
  transform: translateY(-1.5px);
}

/* User: premium soft focus */
.nav-user-button:hover .nav-icon-glyph {
  transform: scale(1.05);
}

.nav-user-button:hover .nav-icon-glyph svg > *:nth-child(1) {
  transform: translateY(-1.5px) scale(1.03);
}

.nav-user-button:hover .nav-icon-glyph svg > *:nth-child(2) {
  transform: translateY(1.5px) scale(1.02);
}

/* Back: arrow slides slightly left */
.nav-back-button:hover .nav-icon-glyph {
  transform: translateX(-2px) scale(1.04);
}

        .nav-brand {
          position: relative;
          isolation: isolate;
        }

        .nav-brand::after {
          content: "";
          position: absolute;
          left: 18px;
          right: 18px;
          bottom: 2px;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(0, 0, 0, 0.45),
            transparent
          );
          opacity: 0;
          transform: scaleX(0.2);
          transition:
            opacity 320ms ease,
            transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .nav-brand:hover::after {
          opacity: 1;
          transform: scaleX(1);
        }

        .nav-brand-logo {
          transition:
            transform 420ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 320ms ease,
            border-color 320ms ease;
        }

        .nav-brand:hover .nav-brand-logo {
          transform: scale(1.045);
          border-color: rgba(0, 0, 0, 0.22);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.12);
        }

        .nav-brand-text {
          transition:
            letter-spacing 360ms ease,
            opacity 300ms ease;
        }

        .nav-brand:hover .nav-brand-text {
          letter-spacing: -0.01em;
          opacity: 0.88;
        }

        .nav-cart-badge {
          animation: cartBadgePulse 2.4s ease-in-out infinite;
        }

        .nav-support-button {
          position: relative;
          isolation: isolate;
          overflow: hidden;
        }

        .nav-support-button::before {
          content: "";
          position: absolute;
          inset: 1px;
          z-index: 0;
          border-radius: 9999px;
          background:
            radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.28), transparent 35%),
            linear-gradient(135deg, rgba(255, 255, 255, 0.16), transparent);
          opacity: 0;
          transition: opacity 320ms ease;
        }

        .nav-support-button::after {
          content: "";
          position: absolute;
          top: -40%;
          left: -50%;
          z-index: 1;
          height: 180%;
          width: 36%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.46),
            transparent
          );
          opacity: 0;
          transform: rotate(18deg);
          pointer-events: none;
        }

        .nav-support-button:hover {
          box-shadow:
            0 12px 34px rgba(0, 0, 0, 0.18),
            inset 0 0 0 1px rgba(255, 255, 255, 0.12);
        }

        .nav-support-button:hover::before {
          opacity: 1;
        }

        .nav-support-button:hover::after {
          animation: navShine 950ms ease-in-out forwards;
        }

        .drawer-close-button,
        .drawer-search-button,
        .drawer-link-card,
        .drawer-category-card,
        .drawer-child-link {
          position: relative;
          isolation: isolate;
          overflow: hidden;
        }

        .drawer-close-button::after,
        .drawer-search-button::after,
        .drawer-link-card::after,
        .drawer-category-card::after,
        .drawer-child-link::after {
          content: "";
          position: absolute;
          top: -40%;
          left: -65%;
          height: 180%;
          width: 42%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.5),
            transparent
          );
          opacity: 0;
          transform: rotate(18deg);
          pointer-events: none;
        }

        .drawer-close-button:hover::after,
        .drawer-search-button:hover::after,
        .drawer-link-card:hover::after,
        .drawer-category-card:hover::after,
        .drawer-child-link:hover::after {
          animation: navShine 880ms ease-in-out forwards;
        }

        .drawer-link-card:hover,
        .drawer-category-card:hover,
        .drawer-child-link:hover {
          box-shadow:
            0 10px 28px rgba(0, 0, 0, 0.1),
            inset 0 0 0 1px rgba(0, 0, 0, 0.04);
        }

        @media (prefers-reduced-motion: reduce) {
          .nav-icon-button::after,
          .nav-support-button::after,
          .drawer-close-button::after,
          .drawer-search-button::after,
          .drawer-link-card::after,
          .drawer-category-card::after,
          .drawer-child-link::after {
            animation: none !important;
          }

          .nav-icon-glyph,
          .nav-brand-logo,
          .nav-brand-text {
            transition: none;
          }

          .nav-cart-badge {
            animation: none;
          }
        }
      `}</style>

      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-5 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            {!searchMode ? (
              <>
                <button
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  aria-label="Open menu"
                  className="nav-icon-button nav-menu-button group inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-black shadow-sm transition-[background,color,border-color,box-shadow] duration-300 active:scale-[0.96]"
                >
                  <span className="nav-icon-glyph">
                    <IconMenu />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={startSearch}
                  aria-label="Search"
                  className="nav-icon-button nav-search-button group inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-black shadow-sm transition-[background,color,border-color,box-shadow] duration-300 active:scale-[0.96]"
                >
                  <span className="nav-icon-glyph">
                    <IconSearch />
                  </span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={backFromSearch}
                aria-label="Back"
                className="nav-icon-button nav-back-button inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-black shadow-sm transition-[background,color,border-color,box-shadow] duration-300 active:scale-[0.96]"
              >
                <span className="nav-icon-glyph">
                  <IconArrowLeft />
                </span>
              </button>
            )}
          </div>

          {!searchMode ? (
            <Link
              href="/"
              className="nav-brand group absolute left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full px-3 py-1.5 transition-colors duration-300 hover:bg-black/[0.03]"
            >
              <span className="nav-brand-logo relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-black/10 bg-white shadow-sm">
                <Image
                  src="/favicon.png"
                  alt={siteName}
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                  priority
                />
              </span>

              <span className="nav-brand-text hidden max-w-[170px] truncate text-base font-black tracking-tight text-black sm:block">
                {siteName}
              </span>
            </Link>
          ) : (
            <div className="flex-1" aria-hidden />
          )}

          {!searchMode ? (
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                aria-label="Cart"
                onClick={onOpenCart}
                className="nav-icon-button nav-cart-button relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-black shadow-sm transition-[background,color,border-color,box-shadow] duration-300 active:scale-[0.96]"
              >
                <span className="nav-icon-glyph">
                  <IconCart />
                </span>

                {cartCount > 0 && (
                  <span className="nav-cart-badge absolute -right-1 -top-1 z-10 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-black px-1.5 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                aria-label="Profile"
                onClick={goToProfile}
                className="nav-icon-button nav-user-button inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-black shadow-sm transition-[background,color,border-color,box-shadow] duration-300 active:scale-[0.96]"
              >
                <span className="nav-icon-glyph">
                  <IconUser />
                </span>
              </button>

              <button
                type="button"
                aria-label="24x7 Support"
                onClick={() => router.push("/support")}
                className="nav-support-button hidden h-10 items-center gap-2 rounded-full border border-black/10 bg-black px-4 text-sm font-bold text-white shadow-sm transition-[box-shadow,border-color] duration-300 active:scale-[0.98] sm:inline-flex"
              >
                <span className="relative z-10 inline-flex items-center gap-2">
                  <IconSupport />
                  <span>Support</span>
                </span>
              </button>
            </div>
          ) : (
            <div className="w-12" aria-hidden />
          )}
        </div>
      </header>

      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${menuOpen
            ? "pointer-events-auto visible"
            : "pointer-events-none invisible"
          }`}
      >
        <button
          type="button"
          aria-label="Close menu overlay"
          onClick={closeMenu}
          className={`absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity duration-300 ${menuOpen ? "opacity-100" : "opacity-0"
            }`}
        />

        <aside
          className={`absolute left-0 top-0 flex h-full w-[88vw] max-w-[390px] flex-col overflow-hidden rounded-r-[2rem] border-r border-white/20 bg-white shadow-2xl transition-transform duration-300 ease-out ${menuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative overflow-hidden border-b border-black/10 bg-gradient-to-br from-black via-zinc-900 to-zinc-700 px-5 pb-5 pt-4 text-white">
            <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-16 left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

            <div className="relative flex items-center justify-between gap-4">
              <Link
                href="/"
                onClick={closeMenu}
                className="flex min-w-0 items-center gap-3"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white shadow-lg">
                  <Image
                    src="/favicon.png"
                    alt={siteName}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                </span>

                <span className="min-w-0">
                  <span className="block truncate text-lg font-black tracking-tight">
                    {siteName}
                  </span>
                  <span className="mt-0.5 block text-xs font-medium text-white/70">
                    Premium shopping experience
                  </span>
                </span>
              </Link>

              <button
                type="button"
                aria-label="Close menu"
                onClick={closeMenu}
                className="drawer-close-button inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-[background,color,border-color,box-shadow] duration-300 hover:bg-white hover:text-black hover:shadow-lg"
              >
                <span className="relative z-10">
                  <IconClose />
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={startSearch}
              className="drawer-search-button relative mt-5 flex w-full items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-left text-sm font-semibold text-white/90 shadow-sm transition-[background,color,border-color,box-shadow] duration-300 hover:bg-white hover:text-black hover:shadow-lg"
            >
              <span className="relative z-10 inline-flex items-center gap-3">
                <IconSearch />
                <span>Search products, categories...</span>
              </span>
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-4">
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                Categories
              </p>

              <Link
                href="/collections/all"
                onClick={closeMenu}
                className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700 transition-all hover:bg-black hover:text-white"
              >
                View all
              </Link>
            </div>

            <div className="grid gap-2">
              {categoryTree.map((root) => {
                const openRoot = expandedRoot === root._id;
                const hasSubCategories = Boolean(root.children?.length);

                return (
                  <div
                    key={root._id}
                    className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      className="drawer-category-card flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-[background,box-shadow] duration-300 hover:bg-zinc-50"
                      onClick={() => {
                        if (!hasSubCategories) {
                          goToCategory({ root: root.name });
                          return;
                        }

                        const next = openRoot ? null : root._id;
                        setExpandedRoot(next);
                        setExpandedSub(null);
                      }}
                    >
                      <span className="relative z-10 min-w-0">
                        <span className="block truncate text-sm font-extrabold text-zinc-950">
                          {root.name}
                        </span>

                        {hasSubCategories ? (
                          <span className="mt-0.5 block text-xs font-medium text-zinc-500">
                            {root.children?.length} collections
                          </span>
                        ) : (
                          <span className="mt-0.5 block text-xs font-medium text-zinc-500">
                            Explore products
                          </span>
                        )}
                      </span>

                      {hasSubCategories ? (
                        <span className="relative z-10 shrink-0 rounded-full bg-zinc-100 p-1.5">
                          <IconChevron open={openRoot} />
                        </span>
                      ) : null}
                    </button>

                    {openRoot && hasSubCategories && (
                      <div className="border-t border-black/10 bg-zinc-50/80 p-2">
                        {root.children?.map((sub) => {
                          const openSub = expandedSub === sub._id;
                          const hasChildren = Boolean(sub.children?.length);

                          return (
                            <div key={sub._id} className="mb-1 last:mb-0">
                              <button
                                type="button"
                                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-bold text-zinc-800 transition-[background,box-shadow,color] duration-300 hover:bg-white hover:shadow-sm"
                                onClick={() => {
                                  if (!hasChildren) {
                                    goToCategory({
                                      root: root.name,
                                      sub: sub.name,
                                    });
                                    return;
                                  }

                                  setExpandedSub(openSub ? null : sub._id);
                                }}
                              >
                                <span className="truncate">{sub.name}</span>

                                {hasChildren ? (
                                  <IconChevron open={openSub} />
                                ) : (
                                  <span className="text-xs text-zinc-400">
                                    View
                                  </span>
                                )}
                              </button>

                              {openSub && hasChildren && (
                                <div className="ml-3 mt-1 grid gap-1 border-l border-black/10 pl-3">
                                  {sub.children?.map((child) => (
                                    <button
                                      key={child._id}
                                      type="button"
                                      className="drawer-child-link rounded-xl px-3 py-2 text-left text-sm font-semibold text-zinc-600 transition-[background,color,box-shadow] duration-300 hover:bg-white hover:text-black hover:shadow-sm"
                                      onClick={() =>
                                        goToCategory({
                                          root: root.name,
                                          sub: sub.name,
                                          child: child.name,
                                        })
                                      }
                                    >
                                      <span className="relative z-10">
                                        {child.name}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {categoryTree.length === 0 && (
                <div className="rounded-2xl border border-dashed border-black/15 bg-zinc-50 px-4 py-5 text-center text-sm font-semibold text-zinc-500">
                  No categories available
                </div>
              )}
            </div>

            <div className="mt-5">
              <p className="mb-3 px-1 text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                Quick Links
              </p>

              <div className="grid gap-2">
                {[
                  { label: "All Collection", href: "/collections/all" },
                  { label: "Wishlist", href: "/wishlist" },
                  { label: "Orders", href: "/orders" },
                  { label: "Return & Exchange Policy", href: "/return-policy" },
                  { label: "Support", href: "/support" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className="drawer-link-card group rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold !text-zinc-800 transition-[background,color,border-color,box-shadow] duration-300 hover:border-black hover:!bg-black hover:!text-white hover:shadow-lg"
                  >
                    <span className="relative z-10 block transition-colors duration-300 group-hover:!text-white">
                      {link.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          <div className="border-t border-black/10 px-5 py-4">
            <div className="text-center">
              <div className="flex justify-center">
                <RatingStars />
              </div>

              <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-900">
                Loved by 7,00,000+ customers
              </p>

              <p className="mt-1 text-xs font-medium text-zinc-500">
                Trusted shopping, fast support, premium quality.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}