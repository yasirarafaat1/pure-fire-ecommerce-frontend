"use client";

import { useEffect, useMemo, useState } from "react";
import { cachedFetch } from "../../utils/cachedFetch";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getUserToken } from "../../utils/auth";
import { defaultPublicSettings, fetchPublicSettings } from "../../utils/public-settings";
import { IconArrowLeft, IconCart, IconChevron, IconClose, IconMenu, IconSearch, IconSupport, IconUser, RatingStars } from "./navbar-icons";

type CategoryNode = {
  _id: string;
  name: string;
  children?: CategoryNode[];
};

type CartItem = { qty?: number | string };
type ProductSummary = {
  status?: string;
  catagory_id?: string | { _id?: string };
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
        const count = items.reduce((sum, item) => sum + Number(item.qty || 1), 0);
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
        const products = ((productsData?.products || []) as ProductSummary[]).filter(
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
    setMenuOpen(false);
    router.push("/search");
  };

  const backFromSearch = () => {
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
          <Link className="flex items-center gap-2 text-lg font-semibold tracking-tight" href="/">
            <Image
              src="/favicon.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 rounded-full object-cover"
              priority
            />
            <span>{siteName}</span>
          </Link>
        ) : (
          <div className="flex-1" aria-hidden />
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
            <h3 className="flex items-center gap-2">
              <Image
                src="/favicon.png"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 rounded-full object-cover"
              />
              <span>{siteName}</span>
            </h3>
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
              <Link className="py-2 border-b border-black/10" href="/wishlist">Wishlist</Link>
              <Link className="py-2 border-b border-black/10" href="/orders">Orders</Link>
              <Link className="py-2 border-b border-black/10" href="/return-exchange-policy">Return & Exchange Policy</Link>
              <Link className="py-2 border-b border-black/10" href="/support">Support</Link>
            </div>
          </nav>
          <div className="absolute bottom-0 right-0 mt-auto px-4 py-5">
            <RatingStars />
            <p className="text-center text-sm font-extrabold tracking-[0.12em] mt-3">
              LOVED BY 7,00,000+ CUSTOMERS
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
