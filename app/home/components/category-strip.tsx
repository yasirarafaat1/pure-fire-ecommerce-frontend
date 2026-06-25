"use client";

import { usePathname, useRouter } from "next/navigation";

const items = [
  {
    label: "New Arrivals",
    slug: "new-arrival",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=300&q=80",
  },
  {
    label: "Best Sellers",
    slug: "best-seller",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=300&q=80",
  },
  {
    label: "Men",
    slug: "men",
    image:
      "https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=300&q=80",
  },
  {
    label: "Women",
    slug: "women",
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=300&q=80",
  },
  {
    label: "Shirts",
    slug: "shirts",
    image:
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80",
  },
  {
    label: "Kurta",
    slug: "kurta",
    image:
      "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=300&q=80",
  },
  {
    label: "Cotton",
    slug: "cotton",
    image:
      "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=300&q=80",
  },
  {
    label: "High Rated",
    slug: "high-rated",
    image:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=300&q=80",
  },
  {
    label: "Summer",
    slug: "summer",
    image:
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=300&q=80",
  },
  {
    label: "T-shirts",
    slug: "t-shirts",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=300&q=80",
  },
  {
    label: "Jeans",
    slug: "jeans",
    image:
      "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=300&q=80",
  },
  {
    label: "Deals",
    slug: "deals",
    image:
      "https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=300&q=80",
  },
];

export default function CategoryStrip() {
  const router = useRouter();
  const pathname = usePathname() || "";

  const parts = pathname.split("/").filter(Boolean);
  const collectionsIndex = parts.indexOf("collections");
  const activeSlug =
    collectionsIndex >= 0 ? parts[collectionsIndex + 1] || "all" : "";

  return (
    <section className="relative overflow-hidden border-b border-black/5 bg-white">
      <style jsx>{`
        @keyframes softFloat {
          0% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
          100% {
            transform: translateY(0);
          }
        }

        @keyframes shineMove {
          0% {
            transform: translateX(-130%) rotate(18deg);
          }
          100% {
            transform: translateX(180%) rotate(18deg);
          }
        }

        .category-scroll {
          scrollbar-width: none;
        }

        .category-scroll::-webkit-scrollbar {
          display: none;
        }

        .category-card:hover .category-shine {
          animation: shineMove 0.85s ease;
        }

        .category-card:hover .category-image {
          transform: scale(1.12);
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(0,0,0,0.05),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(0,0,0,0.04),transparent_26%)]" />

      <div className="relative mx-auto max-w-7xl px-3 sm:px-5 lg:px-8">
        <div
          className="pointer-events-none absolute left-0 top-0 z-10 h-full w-10 bg-gradient-to-r from-white via-white/90 to-transparent sm:w-16"
          aria-hidden
        />

        <div
          className="pointer-events-none absolute right-0 top-0 z-10 h-full w-10 bg-gradient-to-l from-white via-white/90 to-transparent sm:w-16"
          aria-hidden
        />

        <div className="category-scroll flex items-start gap-3 overflow-x-auto scroll-smooth px-1 py-4 sm:gap-4 sm:py-5 md:justify-center">
          {items.map((item, index) => {
            const active = item.slug === activeSlug;

            return (
              <button
                key={item.slug}
                type="button"
                aria-label={item.label}
                aria-current={active ? "true" : undefined}
                onClick={() => router.push(`/collections/${item.slug}`)}
                className="category-card group relative flex min-w-[82px] flex-col items-center gap-2 rounded-3xl outline-none transition-all duration-300 active:scale-[0.97] sm:min-w-[96px]"
                style={{
                  animation: `softFloat 3.2s ease-in-out ${index * 0.08}s infinite`,
                }}
              >
                <span
                  className={`relative flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-[1.6rem] border p-[3px] shadow-sm transition-all duration-300 sm:h-20 sm:w-20 ${
                    active
                      ? "border-black bg-black shadow-[0_14px_35px_rgba(0,0,0,0.22)]"
                      : "border-black/10 bg-white shadow-[0_10px_28px_rgba(0,0,0,0.08)] group-hover:-translate-y-1 group-hover:border-black/25 group-hover:shadow-[0_18px_42px_rgba(0,0,0,0.14)]"
                  }`}
                >
                  <span className="absolute inset-0 rounded-[1.6rem] bg-gradient-to-br from-white/45 via-transparent to-black/10" />

                  <span className="relative h-full w-full overflow-hidden rounded-[1.35rem] bg-zinc-100">
                    <img
                      src={item.image}
                      alt={item.label}
                      loading="lazy"
                      className={`category-image h-full w-full object-cover transition-transform duration-700 ease-out ${
                        active ? "scale-110" : "scale-100"
                      }`}
                    />

                    <span
                      className={`absolute inset-0 transition-all duration-300 ${
                        active
                          ? "bg-black/25"
                          : "bg-gradient-to-t from-black/25 via-black/0 to-white/5 group-hover:bg-black/10"
                      }`}
                    />

                    <span className="category-shine absolute -left-8 top-0 h-full w-5 bg-white/45 blur-[2px]" />
                  </span>

                  {active && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-black text-white ring-2 ring-white">
                      ✓
                    </span>
                  )}
                </span>

                <span
                  className={`max-w-[92px] truncate rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-tight transition-all duration-300 sm:text-xs ${
                    active
                      ? "bg-black text-white shadow-sm"
                      : "bg-transparent text-zinc-800 group-hover:bg-zinc-100 group-hover:text-black"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}