"use client";

import { useEffect, useRef } from "react";
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

const marqueeHalf = Array.from({ length: 3 }).flatMap(() => items);
const marqueeLoop = [...marqueeHalf, ...marqueeHalf];

export default function CategoryStrip() {
  const router = useRouter();
  const pathname = usePathname() || "";

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const activeCardRef = useRef<HTMLButtonElement | null>(null);

  const parts = pathname.split("/").filter(Boolean);
  const collectionsIndex = parts.indexOf("collections");
  const activeSlug =
    collectionsIndex >= 0 ? parts[collectionsIndex + 1] || "all" : "";

  const hasActive = items.some((item) => item.slug === activeSlug);
  const renderItems = hasActive ? items : marqueeLoop;

  useEffect(() => {
    if (!hasActive) return;

    const centerActive = () => {
      const viewport = viewportRef.current;
      const activeCard = activeCardRef.current;

      if (!viewport || !activeCard) return;

      const targetLeft =
        activeCard.offsetLeft -
        viewport.clientWidth / 2 +
        activeCard.offsetWidth / 2;

      viewport.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: "smooth",
      });
    };

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(centerActive);
    });

    window.addEventListener("resize", centerActive);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", centerActive);
    };
  }, [activeSlug, hasActive]);

  return (
    <section className="relative border-b border-black/5 bg-white overflow-hidden">
      <style jsx>{`
        @keyframes softFloat {
          0%,
          100% {
            transform: translateY(0) scale(1);
          }

          50% {
            transform: translateY(-4px) scale(1.015);
          }
        }

        @keyframes categoryMarquee {
          0% {
            transform: translateX(0);
          }

          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes shineMove {
          0% {
            left: -90%;
            opacity: 0;
          }

          12% {
            opacity: 0.85;
          }

          82% {
            opacity: 0.85;
          }

          100% {
            left: 140%;
            opacity: 0;
          }
        }

        .category-marquee-viewport {
          scrollbar-width: none;
          -ms-overflow-style: none;
          scroll-behavior: smooth;
        }

        .category-marquee-viewport::-webkit-scrollbar {
          display: none;
        }

        .category-marquee-viewport.is-moving {
          overflow: hidden;
        }

        .category-marquee-viewport.is-stopped {
          overflow-x: auto;
          overflow-y: visible;
        }

        .category-marquee-track {
          display: flex;
          width: max-content;
          gap: 12px;
          will-change: transform;
        }

        .category-marquee-track.is-moving {
          animation: categoryMarquee 95s linear infinite;
        }

        .category-marquee-track.is-stopped {
          animation: none;
          padding-inline: calc(50% - 41px);
        }

        .category-marquee-viewport:hover .category-marquee-track.is-moving {
          animation-play-state: paused;
        }

        .category-breath {
          animation: softFloat 3.4s ease-in-out infinite;
          will-change: transform;
        }

        .category-card.is-active .category-breath {
          animation: none;
          transform: translateY(-3px);
        }

        .category-card:hover .category-breath {
          animation-play-state: paused;
          transform: translateY(-3px);
        }

        .category-card:hover .category-shine,
        .category-card:focus-visible .category-shine {
          animation: shineMove 1.05s ease-in-out forwards;
        }

        .category-card:hover .category-image {
          transform: scale(1.12);
        }

        @media (min-width: 640px) {
          .category-marquee-track.is-stopped {
            padding-inline: calc(50% - 48px);
          }
        }

        @media (max-width: 767px) {
          .category-marquee-track {
            gap: 10px;
          }

          .category-marquee-track.is-moving {
            animation-duration: 78s;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .category-marquee-track.is-moving {
            animation: none;
          }

          .category-breath {
            animation: none;
          }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(0,0,0,0.05),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(0,0,0,0.04),transparent_26%)]" />

      <div className="relative mx-auto max-w-7xl px-3 sm:px-5 lg:px-8">
        <div
          className="pointer-events-none absolute left-0 top-0 z-30 h-full w-8 bg-gradient-to-r from-white via-white/90 to-transparent sm:w-14"
          aria-hidden
        />

        <div
          className="pointer-events-none absolute right-0 top-0 z-30 h-full w-8 bg-gradient-to-l from-white via-white/90 to-transparent sm:w-14"
          aria-hidden
        />

        <div
          ref={viewportRef}
          className={`category-marquee-viewport relative z-20 pt-4 pb-4 ${
            hasActive ? "is-stopped" : "is-moving"
          }`}
        >
          <div
            className={`category-marquee-track ${
              hasActive ? "is-stopped" : "is-moving"
            }`}
          >
            {renderItems.map((item, index) => {
              const active = item.slug === activeSlug;

              return (
                <button
                  key={`${item.slug}-${index}`}
                  ref={active && hasActive ? activeCardRef : null}
                  type="button"
                  aria-label={item.label}
                  aria-current={active ? "true" : undefined}
                  onClick={() => router.push(`/collections/${item.slug}`)}
                  className={`category-card group relative flex min-w-[82px] flex-col items-center rounded-3xl outline-none transition-[filter] duration-300 active:scale-[0.97] sm:min-w-[96px] ${
                    active ? "is-active z-40" : "z-10 hover:z-40"
                  }`}
                >
                  <div className="category-breath flex flex-col items-center gap-2">
                    <span
                      className={`relative flex h-[72px] w-[72px] items-center justify-center overflow-visible rounded-[1.6rem] border p-[3px] transition-all duration-300 ease-out sm:h-20 sm:w-20 ${
                        active
                          ? "border-black bg-black shadow-[0_14px_34px_rgba(0,0,0,0.28)] ring-2 ring-black/20"
                          : "border-black/10 bg-white shadow-[0_8px_22px_rgba(0,0,0,0.08)] group-hover:border-black/25 group-hover:shadow-[0_14px_34px_rgba(0,0,0,0.14)]"
                      }`}
                    >
                      <span className="pointer-events-none absolute inset-0 rounded-[1.6rem] bg-gradient-to-br from-white/45 via-transparent to-black/10" />

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

                        <span className="category-shine absolute top-[-28%] h-[156%] w-[44%] rotate-[18deg] bg-white/55 blur-[2px] opacity-0" />
                      </span>

                      {active && (
                        <span className="absolute right-0 top-0 z-50 flex h-5 w-5 -translate-y-1 translate-x-1 items-center justify-center rounded-full bg-black text-[10px] font-black text-white ring-2 ring-white shadow-md">
                          ✓
                        </span>
                      )}
                    </span>

                    <span
                      className={`relative z-50 max-w-[92px] truncate rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-tight transition-all duration-300 ease-out sm:text-xs ${
                        active
                          ? "bg-black text-white shadow-[0_8px_20px_rgba(0,0,0,0.18)]"
                          : "bg-transparent text-zinc-800 group-hover:bg-zinc-100 group-hover:text-black"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}