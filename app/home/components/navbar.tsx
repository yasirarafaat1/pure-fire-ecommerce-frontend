"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { cachedFetch } from "../../utils/cachedFetch";
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

const CUSTOMER_LINKS = [
  {
    label: "Orders",
    href: "/orders",
    subtitle: "Track current and past orders",
  },
  {
    label: "Wishlist",
    href: "/wishlist",
    subtitle: "View your saved products",
  },
  {
    label: "Support",
    href: "/support",
    subtitle: "Get help from our team",
  },
  {
    label: "Return Policy",
    href: "/return-policy",
    subtitle: "Return and exchange details",
  },
];

export default function HomeNavbar({ onOpenCart }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);
  const [siteName, setSiteName] = useState(defaultPublicSettings.storeName);
  const [logoSrc, setLogoSrc] = useState(
    defaultPublicSettings.seo?.logoUrl || "/favicon.png",
  );
  const [expandedRoot, setExpandedRoot] = useState<string | null>(null);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const [drawerSearch, setDrawerSearch] = useState("");
  const [scrolled, setScrolled] = useState(false);

  const drawerSearchRef = useRef<HTMLInputElement | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  const searchMode = useMemo(() => pathname.startsWith("/search"), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetchPublicSettings()
      .then((settings) => {
        setSiteName(settings.storeName || defaultPublicSettings.storeName);
        setLogoSrc(settings.seo?.logoUrl || "/favicon.png");
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(() => {
      drawerSearchRef.current?.focus();
    }, 280);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.clearTimeout(timer);
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

  const submitDrawerSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = drawerSearch.trim();

    closeMenu();

    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      return;
    }

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

  const handleLogoError = () => {
    if (logoSrc !== "/favicon.png") setLogoSrc("/favicon.png");
  };

  return (
    <>
      <style jsx>{`
        @keyframes navSweep {
          0% {
            transform: translateX(-140%) rotate(18deg);
            opacity: 0;
          }

          18% {
            opacity: 0.75;
          }

          78% {
            opacity: 0.75;
          }

          100% {
            transform: translateX(170%) rotate(18deg);
            opacity: 0;
          }
        }

        @keyframes drawerEnter {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }

          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes cartPulse {
          0%,
          100% {
            transform: translate(44%, -44%) scale(1);
          }

          50% {
            transform: translate(44%, -44%) scale(1.08);
          }
        }

        @keyframes premiumMenuFloat {
          0% {
            transform: translateX(0);
          }

          42% {
            transform: translateX(-1.5px);
          }

          100% {
            transform: translateX(0);
          }
        }

        .nav-shell {
          position: sticky;
          top: 0;
          z-index: 40;
          border-bottom: 1px solid rgba(15, 23, 42, 0.06);
          background:
            radial-gradient(
              circle at 10% 0%,
              rgba(245, 158, 11, 0.11),
              transparent 30%
            ),
            rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(20px) saturate(1.25);
          -webkit-backdrop-filter: blur(20px) saturate(1.25);
          transition:
            box-shadow 360ms ease,
            border-color 360ms ease,
            background 360ms ease;
        }

        .nav-shell.is-scrolled {
          border-color: rgba(15, 23, 42, 0.1);
          background: rgba(255, 255, 255, 0.96);
          box-shadow:
            0 18px 44px rgba(15, 23, 42, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }

        .nav-action,
        .drawer-close,
        .drawer-search-button,
        .drawer-row,
        .drawer-child-row,
        .drawer-customer-row {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          transform: translateZ(0);
        }

        .nav-cart-button {
          overflow: visible !important;
        }

        .nav-action::after,
        .drawer-close::after,
        .drawer-search-button::after,
        .drawer-row::after,
        .drawer-child-row::after,
        .drawer-customer-row::after {
          content: "";
          position: absolute;
          top: -42%;
          left: -68%;
          z-index: 1;
          height: 184%;
          width: 42%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.58),
            transparent
          );
          opacity: 0;
          transform: rotate(18deg);
          pointer-events: none;
        }

        .nav-action:hover::after,
        .drawer-close:hover::after,
        .drawer-search-button:hover::after,
        .drawer-row:hover::after,
        .drawer-child-row:hover::after,
        .drawer-customer-row:hover::after {
          animation: navSweep 880ms ease-in-out forwards;
        }

        .nav-icon-glyph {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: currentColor;
          transition:
            transform 430ms cubic-bezier(0.22, 1, 0.36, 1),
            color 260ms ease;
        }

        .nav-icon-glyph svg {
          overflow: visible;
        }

        .nav-icon-glyph svg > * {
          transition:
            transform 430ms cubic-bezier(0.22, 1, 0.36, 1),
            opacity 260ms ease,
            stroke-width 320ms ease;
          transform-box: fill-box;
          transform-origin: center;
        }

        .premium-menu-icon {
          position: relative;
          display: inline-block;
          width: 22px;
          height: 16px;
          flex: 0 0 auto;
          overflow: visible;
          color: currentColor;
        }

        .premium-menu-line {
          position: absolute;
          right: 0;
          display: block;
          height: 2px;
          border-radius: 999px;
          background: currentColor;
          opacity: 1;
          transform-origin: right center;
          box-shadow: 0 0 0 0 currentColor;
          transition:
            width 520ms cubic-bezier(0.22, 1, 0.36, 1),
            transform 520ms cubic-bezier(0.22, 1, 0.36, 1),
            opacity 320ms ease;
        }

        .premium-menu-line::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: currentColor;
          opacity: 0;
          transform: translateX(9px) scaleX(0.36);
          transform-origin: right center;
          transition:
            opacity 420ms ease,
            transform 520ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .premium-menu-line-1 {
          top: 1px;
          width: 19px;
        }

        .premium-menu-line-2 {
          top: 7px;
          width: 14px;
        }

        .premium-menu-line-3 {
          top: 13px;
          width: 22px;
        }

        .nav-menu-button:hover .nav-icon-glyph {
          transform: scale(1.04);
        }

        .nav-menu-button:hover .premium-menu-icon {
          animation: premiumMenuFloat 620ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .nav-menu-button:hover .premium-menu-line-1 {
          width: 13px;
          transform: translateX(-6px);
        }

        .nav-menu-button:hover .premium-menu-line-2 {
          width: 22px;
          transform: translateX(2px);
        }

        .nav-menu-button:hover .premium-menu-line-3 {
          width: 15px;
          transform: translateX(-4px);
        }

        .nav-menu-button:hover .premium-menu-line::after {
          opacity: 0.34;
          transform: translateX(6px) scaleX(0.72);
        }

        .nav-search-button:hover .nav-icon-glyph {
          transform: scale(1.06);
        }

        .nav-search-button:hover .nav-icon-glyph svg > *:nth-child(1) {
          transform: scale(1.05);
        }

        .nav-search-button:hover .nav-icon-glyph svg > *:nth-child(2) {
          transform: translate(1.5px, 1.5px);
        }

        .nav-cart-button:hover .nav-icon-glyph,
        .nav-user-button:hover .nav-icon-glyph {
          transform: scale(1.055);
        }

        .nav-brand {
          position: relative;
          isolation: isolate;
        }

        .nav-brand::before {
          content: "";
          position: absolute;
          inset: -7px -10px;
          z-index: -1;
          border-radius: 999px;
          background:
            linear-gradient(135deg, rgba(245, 158, 11, 0.12), transparent),
            rgba(15, 23, 42, 0.04);
          opacity: 0;
          transform: scale(0.86);
          transition:
            opacity 340ms ease,
            transform 430ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .nav-brand:hover::before {
          opacity: 1;
          transform: scale(1);
        }

        .nav-brand-logo {
          transition:
            transform 430ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 340ms ease,
            border-color 340ms ease;
        }

        .nav-brand:hover .nav-brand-logo {
          transform: translateY(-1px) scale(1.06);
          border-color: rgba(245, 158, 11, 0.55);
          box-shadow:
            0 14px 32px rgba(15, 23, 42, 0.14),
            0 0 0 5px rgba(245, 158, 11, 0.08);
        }

        .nav-brand-text {
          transition:
            opacity 280ms ease,
            transform 360ms cubic-bezier(0.22, 1, 0.36, 1),
            letter-spacing 320ms ease;
        }

        .nav-brand:hover .nav-brand-text {
          opacity: 0.9;
          transform: translateY(-0.5px);
          letter-spacing: -0.02em;
        }

        .cart-badge {
          top: 0 !important;
          right: 0 !important;
          min-width: 19px !important;
          height: 19px !important;
          min-height: 19px !important;
          padding: 0 5px !important;
          border-radius: 999px !important;
          border: 2px solid #ffffff;
          background: #facc15;
          color: #0f172a !important;
          box-shadow:
            0 8px 18px rgba(15, 23, 42, 0.18),
            0 0 0 1px rgba(15, 23, 42, 0.05);
          line-height: 1 !important;
          pointer-events: none;
          transform: translate(44%, -44%);
          animation: cartPulse 2.35s ease-in-out infinite;
        }

        .nav-cart-button:hover .cart-badge {
          background: #facc15;
          color: #0f172a !important;
          border-color: #ffffff;
        }

        .drawer-panel {
          box-shadow:
            30px 0 90px rgba(15, 23, 42, 0.24),
            inset -1px 0 0 rgba(255, 255, 255, 0.6);
        }

        .drawer-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
          overscroll-behavior: contain;
        }

        .drawer-scroll::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }

        .drawer-enter {
          animation: drawerEnter 430ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .drawer-search-input::placeholder {
          color: rgba(100, 116, 139, 0.84);
        }

        .drawer-safe-link,
        .drawer-safe-link * {
          text-decoration: none;
        }

        .drawer-row:hover .drawer-row-title,
        .drawer-row:hover .drawer-row-subtitle,
        .drawer-row:hover .drawer-row-arrow,
        .drawer-customer-row:hover .drawer-row-title,
        .drawer-customer-row:hover .drawer-row-subtitle,
        .drawer-customer-row:hover .drawer-row-arrow {
          color: #ffffff !important;
        }

        .drawer-row:hover .drawer-row-index,
        .drawer-customer-row:hover .drawer-row-index {
          border-color: rgba(255, 255, 255, 0.2) !important;
          background: rgba(255, 255, 255, 0.14) !important;
          color: #ffffff !important;
        }

        .drawer-child-row:hover {
          transform: translateX(3px);
        }

        @media (max-width: 430px) {
          .nav-brand-name {
            max-width: 128px;
            font-size: 13px;
          }

          .nav-left-label {
            display: none;
          }

          .nav-menu-button {
            width: 42px;
            justify-content: center;
            padding-left: 0;
            padding-right: 0;
          }
        }

        @media (max-width: 360px) {
          .nav-brand-name {
            max-width: 104px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .nav-action::after,
          .drawer-close::after,
          .drawer-search-button::after,
          .drawer-row::after,
          .drawer-child-row::after,
          .drawer-customer-row::after,
          .cart-badge,
          .premium-menu-icon {
            animation: none !important;
          }

          .nav-icon-glyph,
          .nav-icon-glyph svg > *,
          .nav-brand-logo,
          .nav-brand-text,
          .drawer-child-row,
          .premium-menu-line,
          .premium-menu-line::after {
            transition: none !important;
          }
        }
      `}</style>

      <header className={`nav-shell ${scrolled ? "is-scrolled" : ""}`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-3 sm:px-5 lg:px-8">
          <div className="flex min-w-0 items-center gap-2 rounded-sm border border-slate-900/10 bg-white/80 p-1 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            {!searchMode ? (
              <>
                <button
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  aria-label="Open menu"
                  aria-expanded={menuOpen}
                  className="nav-action nav-menu-button inline-flex h-9 cursor-pointer items-center gap-2 rounded-sm bg-slate-950 px-3 text-sm font-black text-white transition active:scale-[0.97]"
                >
                  <span className="nav-icon-glyph" aria-hidden="true">
                    <span className="premium-menu-icon">
                      <span className="premium-menu-line premium-menu-line-1" />
                      <span className="premium-menu-line premium-menu-line-2" />
                      <span className="premium-menu-line premium-menu-line-3" />
                    </span>
                  </span>

                  <span className="nav-left-label relative z-10">Menu</span>
                </button>

                <button
                  type="button"
                  onClick={startSearch}
                  aria-label="Search"
                  className="nav-action nav-search-button inline-flex h-9 cursor-pointer items-center gap-2 rounded-sm bg-slate-100 px-3 text-sm font-bold text-slate-700 transition hover:bg-amber-100 hover:text-slate-950 active:scale-[0.97]"
                >
                  <span className="nav-icon-glyph text-slate-800">
                    <IconSearch />
                  </span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={backFromSearch}
                aria-label="Back"
                className="nav-action nav-back-button inline-flex h-9 items-center gap-2 rounded-sm bg-slate-950 px-3 text-sm font-black text-white transition active:scale-[0.97]"
              >
                <span className="nav-icon-glyph">
                  <IconArrowLeft />
                </span>
                <span className="relative z-10">Back</span>
              </button>
            )}
          </div>

          {!searchMode ? (
            <Link
              href="/"
              className="nav-brand group absolute left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-sm px-2.5 py-1.5"
              aria-label={`${siteName} home`}
            >
              <span className="nav-brand-logo relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-900/10 bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoSrc}
                  alt={siteName}
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                  onError={handleLogoError}
                />
              </span>

              <span className="nav-brand-text nav-brand-name block max-w-[154px] truncate text-sm font-black tracking-tight text-slate-950 sm:max-w-[210px] sm:text-base">
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
                className="nav-action nav-cart-button relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-sm border border-slate-900/10 bg-white text-slate-950 shadow-[0_8px_24px_rgba(15,23,42,0.07)] transition hover:bg-slate-950 hover:text-white active:scale-[0.96]"
              >
                <span className="nav-icon-glyph">
                  <IconCart />
                </span>

                {cartCount > 0 && (
                  <span className="cart-badge absolute z-20 flex items-center justify-center text-[10px] font-black leading-none">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                aria-label="Profile"
                onClick={goToProfile}
                className="nav-action nav-user-button inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-sm border border-slate-900/10 bg-white text-slate-950 shadow-[0_8px_24px_rgba(15,23,42,0.07)] transition hover:bg-slate-950 hover:text-white active:scale-[0.96]"
              >
                <span className="nav-icon-glyph">
                  <IconUser />
                </span>
              </button>

              <button
                type="button"
                aria-label="24x7 Support"
                onClick={() => router.push("/support")}
                className="nav-action hidden h-10 cursor-pointer items-center gap-2 rounded-sm bg-slate-950 px-4 text-sm font-black text-white shadow-[0_12px_28px_rgba(15,23,42,0.16)] transition hover:bg-amber-400 hover:text-slate-950 active:scale-[0.98] sm:inline-flex"
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
        className={`fixed inset-0 z-50 transition-all duration-300 ${
          menuOpen ? "pointer-events-auto visible" : "pointer-events-none invisible"
        }`}
      >
        <button
          type="button"
          aria-label="Close menu overlay"
          onClick={closeMenu}
          className={`absolute inset-0 bg-slate-950/55 backdrop-blur-[4px] transition-opacity duration-300 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <aside
          className={`drawer-panel absolute left-0 top-0 flex h-full w-[92vw] max-w-[420px] flex-col overflow-hidden rounded-r-sm border-r border-white/30 bg-[#fbfaf7] transition-transform duration-500 ease-out ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="border-b border-slate-900/8 bg-white px-5 pb-4 pt-4">
            <div className="drawer-enter flex items-center justify-between gap-4">
              <Link
                href="/"
                onClick={closeMenu}
                className="flex min-w-0 items-center gap-3 rounded-sm transition hover:opacity-85"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-900/10 bg-white shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoSrc}
                    alt={siteName}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                    onError={handleLogoError}
                  />
                </span>

                <span className="min-w-0">
                  <span className="block truncate text-lg font-black tracking-tight text-slate-950">
                    {siteName}
                  </span>
                  <span className="mt-0.5 block text-xs font-semibold text-slate-500">
                    Premium shopping experience
                  </span>
                </span>
              </Link>

              <button
                type="button"
                aria-label="Close menu"
                onClick={closeMenu}
                className="drawer-close inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-slate-900/10 bg-slate-100 text-slate-950 transition hover:bg-slate-950 hover:text-white active:scale-[0.96]"
              >
                <span className="relative z-10">
                  <IconClose />
                </span>
              </button>
            </div>

            <form
              onSubmit={submitDrawerSearch}
              className="drawer-enter mt-4"
              style={{ animationDelay: "70ms" }}
            >
              <label className="group flex w-full cursor-text items-center gap-3 rounded-sm border border-slate-900/10 bg-slate-50 px-3 py-2.5 transition focus-within:border-amber-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-amber-300/20">
                <input
                  ref={drawerSearchRef}
                  value={drawerSearch}
                  onChange={(event) => setDrawerSearch(event.target.value)}
                  type="search"
                  inputMode="search"
                  autoComplete="off"
                  placeholder="Search products, colors, sizes..."
                  className="drawer-search-input min-w-0 flex-1 cursor-text bg-transparent text-sm font-bold text-slate-950 caret-amber-500 outline-none"
                />

                <button
                  type="submit"
                  aria-label="Search"
                  className="shrink-0 rounded-sm transition active:scale-[0.96]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-slate-950 text-white">
                    <IconSearch />
                  </span>
                </button>
              </label>
            </form>
          </div>

          <nav className="drawer-scroll flex-1 overflow-y-auto px-4 py-4">
            <section className="drawer-enter" style={{ animationDelay: "110ms" }}>
              <div className="mb-3 flex items-end justify-between px-1">
                <Link
                  href="/collections/all"
                  onClick={closeMenu}
                  className="drawer-safe-link inline-flex items-center justify-center rounded-sm border border-slate-950 bg-slate-950 px-3 py-2 text-xs font-black !text-white shadow-sm transition hover:border-amber-400 hover:!bg-amber-400 hover:!text-slate-950"
                >
                  View all
                </Link>
              </div>

              <div className="grid gap-2">
                {categoryTree.map((root, index) => {
                  const openRoot = expandedRoot === root._id;
                  const hasSubCategories = Boolean(root.children?.length);

                  return (
                    <div
                      key={root._id}
                      className="overflow-hidden rounded-sm border border-slate-900/8 bg-white shadow-sm"
                    >
                      <button
                        type="button"
                        className="drawer-row group flex w-full cursor-pointer items-center gap-3 px-3 py-3 text-left transition hover:!bg-slate-950"
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
                        <span className="drawer-row-index relative z-10 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-slate-900/8 bg-slate-100 text-xs font-black text-slate-500 transition group-hover:border-white/20 group-hover:!bg-white/15 group-hover:!text-white">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <span className="relative z-10 min-w-0 flex-1 cursor-pointer">
                          <span className="drawer-row-title block cursor-pointer truncate text-sm font-black text-slate-950 transition group-hover:!text-white">
                            {root.name}
                          </span>

                          <span className="drawer-row-subtitle mt-0.5 block cursor-pointer truncate text-xs font-semibold text-slate-500 transition group-hover:!text-white/80">
                            {hasSubCategories
                              ? `${root.children?.length} sub categories`
                              : "Explore products"}
                          </span>
                        </span>

                        <span className="drawer-row-arrow relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-slate-100 text-slate-700 transition group-hover:!bg-white/15 group-hover:!text-white">
                          {hasSubCategories ? (
                            <IconChevron open={openRoot} />
                          ) : (
                            "→"
                          )}
                        </span>
                      </button>

                      {openRoot && hasSubCategories ? (
                        <div className="grid gap-1.5 border-t border-slate-900/8 bg-slate-50 p-2">
                          {root.children?.map((sub) => {
                            const openSub = expandedSub === sub._id;
                            const hasChildren = Boolean(sub.children?.length);

                            return (
                              <div key={sub._id}>
                                <button
                                  type="button"
                                  className="drawer-child-row group flex w-full cursor-pointer items-center justify-between rounded-sm bg-white px-3 py-2.5 text-left text-sm font-black text-slate-800 shadow-sm transition hover:!bg-slate-950 hover:!text-white"
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
                                  <span className="relative z-10 min-w-0 truncate transition group-hover:!text-white">
                                    {sub.name}
                                  </span>

                                  <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-500 transition group-hover:!bg-white/15 group-hover:!text-white">
                                    {hasChildren ? (
                                      <IconChevron open={openSub} />
                                    ) : (
                                      "→"
                                    )}
                                  </span>
                                </button>

                                {openSub && hasChildren ? (
                                  <div className="ml-4 mt-1.5 grid gap-1.5 border-l border-slate-900/10 pl-3">
                                    {sub.children?.map((child) => (
                                      <button
                                        key={child._id}
                                        type="button"
                                        className="cursor-pointer rounded-sm px-3 py-2 text-left text-sm font-bold text-slate-600 transition hover:!bg-slate-950 hover:!text-white hover:shadow-sm"
                                        onClick={() =>
                                          goToCategory({
                                            root: root.name,
                                            sub: sub.name,
                                            child: child.name,
                                          })
                                        }
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
                      ) : null}
                    </div>
                  );
                })}

                {categoryTree.length === 0 ? (
                  <div className="rounded-sm border border-dashed border-slate-900/15 bg-white px-4 py-6 text-center">
                    <p className="text-sm font-black text-slate-600">
                      No categories available
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      Please check back soon.
                    </p>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="drawer-enter mt-6" style={{ animationDelay: "150ms" }}>
              <div className="grid gap-2">
                {CUSTOMER_LINKS.map((link, index) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className="drawer-safe-link drawer-customer-row group flex items-center gap-3 rounded-sm border border-slate-900/8 bg-white p-3 shadow-sm transition hover:!bg-slate-950 hover:shadow-lg active:scale-[0.99]"
                  >
                    <span className="drawer-row-index relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-slate-900/8 bg-slate-100 text-xs font-black text-slate-500 transition group-hover:border-white/20 group-hover:!bg-white/15 group-hover:!text-white">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="relative z-10 min-w-0 flex-1">
                      <span className="drawer-row-title block truncate text-sm font-black text-slate-950 transition group-hover:!text-white">
                        {link.label}
                      </span>
                      <span className="drawer-row-subtitle block truncate text-xs font-semibold text-slate-500 transition group-hover:!text-white/80">
                        {link.subtitle}
                      </span>
                    </span>

                    <span className="drawer-row-arrow relative z-10 text-lg leading-none text-slate-400 transition group-hover:translate-x-0.5 group-hover:!text-white">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </nav>

          <div className="border-t border-slate-900/8 bg-white px-5 py-4">
            <div className="flex justify-center">
              <RatingStars />
            </div>

            <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-slate-950">
              Loved by 7,00,000+ customers
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              Trusted shopping, fast support, premium quality.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}