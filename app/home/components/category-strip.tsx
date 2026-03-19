"use client";

import { usePathname, useRouter } from "next/navigation";
import { FiZap, FiStar, FiUser, FiFeather, FiSun, FiGift } from "react-icons/fi";
import { PiTShirtLight, PiShirtFoldedLight, PiPantsDuotone } from "react-icons/pi";
import { BsStars } from "react-icons/bs";
import { GrUserFemale } from "react-icons/gr";
import { GiShirt } from "react-icons/gi";

const iconBase = "w-6 h-6 sm:w-7 sm:h-7";

const items = [
  { label: "New Arrivals", slug: "new-arrival", Icon: FiZap, drift: "right" },
  { label: "Best Sellers", slug: "best-seller", Icon: FiStar, drift: "left" },
  { label: "Men", slug: "men", Icon: FiUser, drift: "up" },
  { label: "Women", slug: "women", Icon: GrUserFemale , drift: "down" },
  { label: "Shirts", slug: "shirts", Icon: PiShirtFoldedLight, drift: "down" },
  { label: "Kurta", slug: "kurta", Icon: GiShirt, drift: "left" },
  { label: "Cotton", slug: "cotton", Icon: FiFeather, drift: "right" },
  { label: "High Rated", slug: "high-rated", Icon: BsStars, drift: "up" },
  { label: "Summer", slug: "summer", Icon: FiSun, drift: "up" },
  { label: "T-shirts", slug: "t-shirts", Icon: PiTShirtLight, drift: "left" },
  { label: "Jeans", slug: "jeans", Icon: PiPantsDuotone, drift: "right" },
  { label: "Deals", slug: "deals", Icon: FiGift, drift: "up" },
];

export default function CategoryStrip() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const parts = pathname.split("/").filter(Boolean);
  const collectionsIndex = parts.indexOf("collections");
  const activeSlug = collectionsIndex >= 0 ? parts[collectionsIndex + 1] || "all" : "";

  return (
    <div className="border-black/10 bg-white">
      <style jsx>{`
        @keyframes pulseRing {
          0% {
            transform: scale(0.9);
            opacity: 0.7;
          }
          70% {
            transform: scale(1.16);
            opacity: 0;
          }
          100% {
            opacity: 0;
          }
        }
        @keyframes float-up {
          0% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
          100% { transform: translateY(0); }
        }
        @keyframes float-down {
          0% { transform: translateY(0); }
          50% { transform: translateY(4px); }
          100% { transform: translateY(0); }
        }
        @keyframes float-left {
          0% { transform: translateX(0); }
          50% { transform: translateX(-4px); }
          100% { transform: translateX(0); }
        }
        @keyframes float-right {
          0% { transform: translateX(0); }
          50% { transform: translateX(4px); }
          100% { transform: translateX(0); }
        }
        .strip-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 0, 0, 0.4) transparent;
        }
        .strip-scroll::-webkit-scrollbar {
          height: 4px;
        }
        .strip-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .strip-scroll::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.35);
          border-radius: 999px;
        }
      `}</style>
      <div className="relative max-w-6xl mx-auto px-4 my-auto">
        <div className="pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-white to-transparent" aria-hidden />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-white to-transparent" aria-hidden />
        <div className="strip-scroll flex items-center md:justify-center pb-3 pt-4 z-9 gap-4 min-w-full overflow-x-auto snap-x snap-mandatory scroll-smooth">
          {items.map(({ label, slug, Icon, drift }) => {
            const active = slug === activeSlug;
            return (
            <button
              key={label}
              className="group flex flex-col items-center justify-center gap-1 cursor-pointer min-w-[80px] focus:outline-none active:scale-[0.98] snap-start"
              aria-label={label}
              aria-current={active ? "true" : undefined}
              onClick={() => router.push(`/collections/${slug}`)}
            >
              <span
                className={`relative w-14 h-14 rounded-full border flex items-center justify-center transition hover:-translate-y-1 ${
                  active ? "border-black bg-black text-white" : "border-black/12 bg-black/5"
                }`}
              >
                <span className="absolute inset-0 rounded-full border border-black/10 animate-[pulseRing_2s_ease-out_infinite]" aria-hidden />
                <Icon
                  className={`${iconBase} stroke-[2.2] transition-transform duration-300 ease-out group-hover:scale-110 ${
                    drift === "up"
                      ? "animate-[float-up_2.6s_ease-in-out_infinite]"
                      : drift === "down"
                      ? "animate-[float-down_2.6s_ease-in-out_infinite]"
                      : drift === "left"
                      ? "animate-[float-left_2.6s_ease-in-out_infinite]"
                      : "animate-[float-right_2.6s_ease-in-out_infinite]"
                  } group-hover:animate-none ${active ? "text-white" : ""}`}
                />
              </span>
              <span className="text-xs font-semibold text-black">{label}</span>
            </button>
          )})}
        </div>
      </div>
    </div>
  );
}
