"use client";

import { FaStar } from "react-icons/fa6";
import {
  FiCheckCircle,
  FiRefreshCw,
  FiCompass,
  FiShield,
  FiTruck,
} from "react-icons/fi";

type Feature = {
  title: string;
  sub: string;
  Icon: any;
};

type MarqueeItem = {
  label: string;
  Icon: any;
};

const features: Feature[] = [
  { title: "Quality Manufacturing", sub: "Clean finishing & strict checks", Icon: FiShield },
  { title: "Sizing & Fit", sub: "True-to-size tailoring", Icon: FiCompass },
  { title: "Fabric Promise", sub: "Breathable, skin-friendly", Icon: FiCheckCircle },
  { title: "Easy Returns", sub: "Hassle-free exchanges", Icon: FiRefreshCw },
];

const marqueeItems: MarqueeItem[] = [
  { label: "Premium stitching", Icon: FiShield },
  { label: "Perfect fit", Icon: FiCompass },
  { label: "Soft fabrics", Icon: FiCheckCircle },
  { label: "Fast delivery", Icon: FiTruck },
  { label: "Color-safe dyes", Icon: FiShield },
  { label: "Easy exchanges", Icon: FiRefreshCw },
];

const marqueeHalf = Array.from({ length: 6 }).flatMap(() => marqueeItems);
const loop = [...marqueeHalf, ...marqueeHalf];

export default function QualityMarquee() {
  return (
    <section>
      <div className="min-h-[200px] max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center text-center gap-3 py-5">
          <div className="flex items-center gap-1 text-black">
            {Array.from({ length: 5 }).map((_, i) => (
              <FaStar key={i} className="text-black" />
            ))}
          </div>

          <div className="text-xs tracking-[0.25em] uppercase font-semibold">
            Loved by 7,00,000+ customers
          </div>

          <div className="text-xs text-[var(--muted)]">
            Quality, fit, and comfort that keep people coming back.
          </div>
        </div>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-5 py-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="border-b border-t border-black/10 p-4 flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-[5px] border border-black/10 flex items-center justify-center flex-shrink-0">
                <f.Icon className="text-black" />
              </div>

              <div className="min-w-0 text-left">
                <div className="text-sm font-semibold">{f.title}</div>
                <div className="text-xs text-[var(--muted)] mt-1">{f.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 border-b border-t border-black/10 overflow-hidden">
          <div className="marquee flex items-center gap-6 py-3 px-4">
            {loop.map((item, idx) => (
              <div
                key={`${item.label}-${idx}`}
                className="flex items-center gap-2 text-xs font-semibold whitespace-nowrap flex-shrink-0"
              >
                <item.Icon className="text-black flex-shrink-0" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <style jsx>{`
          .marquee {
            width: max-content;
            animation: marquee 55s linear infinite;
            will-change: transform;
          }

          .marquee:hover {
            animation-play-state: paused;
          }

          @keyframes marquee {
            0% {
              transform: translateX(0);
            }

            100% {
              transform: translateX(-50%);
            }
          }

          @media (max-width: 767px) {
            .marquee {
              animation-duration: 42s;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .marquee {
              animation: none;
              width: auto;
              overflow-x: auto;
            }
          }
        `}</style>
      </div>
    </section>
  );
}