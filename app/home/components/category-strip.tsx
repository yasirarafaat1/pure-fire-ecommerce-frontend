"use client";

import { FiZap, FiStar, FiUser, FiFeather, FiSun, FiGift, FiPercent } from "react-icons/fi";
import { PiTShirtLight, PiShirtFoldedLight, PiPantsDuotone } from "react-icons/pi";
import { MdWoman } from "react-icons/md";
import { BsStars } from "react-icons/bs";

const iconBase = "w-6 h-6 sm:w-7 sm:h-7";

const items = [
  { label: "New Arrivals", Icon: FiZap, drift: "right" },
  { label: "Best Sellers", Icon: FiStar, drift: "left" },
  { label: "Men", Icon: FiUser, drift: "up" },
  { label: "Shirts", Icon: PiShirtFoldedLight, drift: "down" },
  { label: "Cotton", Icon: FiFeather, drift: "right" },
  { label: "Top Wears", Icon: BsStars, drift: "up" },
  { label: "Summer", Icon: FiSun, drift: "up" },
  { label: "T-shirts", Icon: PiTShirtLight, drift: "left" },
  { label: "Jeans", Icon: PiPantsDuotone, drift: "right" },
  { label: "Deals", Icon: FiGift, drift: "up" },
];

export default function CategoryStrip() {
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
      `}</style>
      <div className="relative max-w-6xl mx-auto px-4 py-3">
        <div className="pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-white to-transparent" aria-hidden />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-white to-transparent" aria-hidden />
        <div className="flex items-center justify-center gap-4 min-w-full overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth">
          {items.map(({ label, Icon, drift }) => (
            <button
              key={label}
              className="group flex flex-col items-center justify-center gap-1 min-w-[80px] focus:outline-none active:scale-[0.98] snap-start"
              aria-label={label}
            >
              <span className="relative w-14 h-14 rounded-full border border-black/12 bg-black/5 flex items-center justify-center transition hover:-translate-y-1">
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
                  } group-hover:animate-none`}
                />
              </span>
              <span className="text-xs font-semibold text-black">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
