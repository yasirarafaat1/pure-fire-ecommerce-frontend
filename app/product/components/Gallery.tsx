"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FaStar } from "react-icons/fa";
import { IoIosClose } from "react-icons/io";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { PiShareNetworkThin, PiArrowsOutLight, PiHeartLight, PiHeartFill } from "react-icons/pi";

type SimilarItem = { title: string; price: string; image: string; badge?: string };
type Props = {
  title: string;
  images: string[];
  video?: string;
  similarItems?: SimilarItem[];
  rating?: number;
  reviews?: number;
  highlights?: { key: string; value: string }[];
  selectedColor?: string | null;
  selectedSize?: string | null;
  wishlisted?: boolean;
  onToggleWishlist?: () => void;
};
type Media = { type: "image" | "video"; src: string };

export default function Gallery({
  title,
  images,
  video,
  similarItems = [],
  rating = 0,
  reviews = 0,
  highlights = [],
  selectedColor,
  selectedSize,
  wishlisted,
  onToggleWishlist,
}: Props) {
  const media: Media[] = useMemo(() => {
    const list: Media[] = [];
    if (images[0]) list.push({ type: "image", src: images[0] });
    if (video) list.push({ type: "video", src: video });
    images.slice(1).forEach((img) => list.push({ type: "image", src: img }));
    return list;
  }, [images, video]);

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [closing, setClosing] = useState(false);
  const mobileScrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollPct, setScrollPct] = useState(0);
  const [showSimilar, setShowSimilar] = useState(false);

  useEffect(() => setOpenIndex(null), [title]);
  useEffect(() => setZoom(false), [openIndex]);

  const go = (dir: 1 | -1) => {
    if (openIndex === null) return;
    const next = (openIndex + dir + media.length) % media.length;
    setOpenIndex(next);
  };

  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => {
      setOpenIndex(null);
      setClosing(false);
    }, 520);
  };

  const backdropClass = closing ? "animate-backdrop-rev" : "animate-backdrop";
  const panelClass = closing ? "animate-pop-rev" : "animate-pop";

  const handleMobileScroll = () => {
    const el = mobileScrollRef.current;
    if (!el) return;
    const pct = el.scrollWidth > el.clientWidth ? el.scrollLeft / (el.scrollWidth - el.clientWidth) : 0;
    setScrollPct(pct);
  };

  return (
    <>
      {/* Mobile horizontal scroll like Flipkart */}
      <div className="md:hidden">
        <div
          ref={mobileScrollRef}
          className="flex overflow-x-auto gap-3 snap-x snap-mandatory scrollbar-hide relative"
          onScroll={handleMobileScroll}
        >
          {media.map((m, i) => (
            <div
              key={i}
              role="button"
              tabIndex={0}
              className="min-w-full snap-center pr-4 border border-black/10 overflow-hidden relative"
              onClick={() => setOpenIndex(i)}
              onKeyDown={(e) => e.key === "Enter" && setOpenIndex(i)}
            >
              <div className="absolute top-3 left-3 flex gap-2 z-10">
                <button
                  className="w-10 h-10 rounded-full bg-white shadow border flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    try {
                      const url = new URL(window.location.href);
                      if (selectedColor) url.searchParams.set("color", selectedColor);
                      if (selectedSize) url.searchParams.set("size", selectedSize);
                      navigator?.share?.({ title, url: url.toString() }).catch(() => {});
                    } catch {
                      navigator?.share?.({ title, url: window.location.href }).catch(() => {});
                    }
                  }}
                >
                  <PiShareNetworkThin size={20} />
                </button>
                <button
                  className="w-10 h-10 rounded-full bg-white shadow border flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenIndex(i);
                  }}
                >
                  <PiArrowsOutLight size={20} />
                </button>
              </div>
              {m.type === "image" ? (
                <img src={m.src} alt={title} className="w-full h-[75vh] object-cover" />
              ) : (
                <video
                  src={m.src}
                  className="w-full h-[75vh] object-cover bg-black"
                  muted
                  autoPlay
                  loop
                />
            )}
              {i === 2 && highlights.length > 0 && (
                <div className="absolute inset-0 bg-black/35 text-white p-5 pt-25 flex flex-col gap-4">
                  {highlights.slice(0, 5).map((h, idx) => (
                    <div key={`${h.key}-${idx}`}>
                      <p className="text-lg font-semibold">{h.key}</p>
                      <p className="text-sm text-white/90">{h.value}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="absolute right-3 bottom-3 flex items-center gap-2 bg-white rounded-full px-3 py-1 shadow">
                <span className="flex items-center gap-1 text-sm font-semibold"><FaStar/>{rating.toFixed(1)}</span>
                <span className="text-xs text-[var(--muted)]">{reviews}</span>
              </div>
              <button
                className="absolute left-3 bottom-3 z-10 bg-white text-black w-10 h-10 rounded-full border shadow flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWishlist?.();
                }}
              >
                {wishlisted ? <PiHeartFill size={20} /> : <PiHeartLight size={20} />}
              </button>
            </div>
          ))}
        </div>
        <div className="mt-2 h-1 rounded bg-black/10 overflow-hidden">
          <div
            className="h-full bg-black transition-all duration-150"
            style={{ width: `${Math.min(100, Math.max(0, scrollPct * 100))}%` }}
          />
        </div>
      </div>

      {/* Desktop grid */}
      <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 gap-3">
        {media.map((m, i) => (
          <button
            key={i}
            className="group w-full border border-black/15 rounded-[5px] overflow-hidden bg-white"
            onClick={() => setOpenIndex(i)}
          >
            {m.type === "image" ? (
              <img
                src={m.src}
                alt={title}
                className="w-full h-full object-cover cursor-zoom-in aspect-[3/4] transition-transform duration-300"
              />
            ) : (
              <video
                src={m.src}
                className="w-full h-full cursor-zoom-in aspect-[3/4] bg-black"
                muted
                autoPlay
                loop
              />
            )}
          </button>
        ))}
      </div>

      {openIndex !== null && media[openIndex] && (
        <div
          className={`fixed inset-0 z-50 bg-white flex items-center justify-center p-4 ${backdropClass}`}
          onClick={requestClose}
        >
          <button
            className="absolute cursor-pointer top-6 right-6 w-11 h-11 rounded-full bg-white shadow border flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              requestClose();
            }}
          >
            <IoIosClose size={28} />
          </button>

          <button
            className="absolute cursor-pointer left-6 w-11 h-11 rounded-full bg-white/90 shadow border flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
          >
            <IoChevronBack size={22} />
          </button>
          <button
            className="absolute cursor-pointer right-6 w-11 h-11 rounded-full bg-white/90 shadow border flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
          >
            <IoChevronForward size={22} />
          </button>

          <div className={`max-w-4xl w-full flex items-center justify-center ${panelClass}`} onClick={(e) => e.stopPropagation()}>
            <div key={openIndex} className="w-full animate-pop">
              {media[openIndex].type === "image" ? (
                <div className="overflow-hidden bg-white max-h-[90vh]">
                  <img
                    src={media[openIndex].src}
                    alt={title}
                    onClick={(e) => {
                      const rect = (e.target as HTMLImageElement).getBoundingClientRect();
                      const x = ((e.clientX - rect.left) / rect.width) * 100;
                      const y = ((e.clientY - rect.top) / rect.height) * 100;
                      setZoomOrigin({ x, y });
                      setZoom((z) => !z);
                    }}
                    onDoubleClick={() => setZoom((z) => !z)}
                    style={{ transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%` }}
                    className={`w-full h-full max-h-[90vh] object-contain transition-transform duration-200 ${
                      zoom ? "scale-[2] cursor-zoom-out" : "hover:scale-[1.05] cursor-zoom-in"
                    }`}
                  />
                </div>
              ) : (
                <video
                  src={media[openIndex].src}
                  className="w-full h-full max-h-[90vh]"
                  onClick={(e) => e.stopPropagation()}
                  muted
                  autoPlay
                  loop
                  // controls
                />
              )}
            </div>
          </div>
        </div>
      )}

      {showSimilar && similarItems.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-4" onClick={() => setShowSimilar(false)}>
          <div
            className="w-full max-w-3xl bg-white rounded-t-2xl md:rounded-2xl p-4 md:p-6 animate-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Similar style</h3>
              <button className="w-9 h-9 rounded-full border flex items-center justify-center" onClick={() => setShowSimilar(false)}>
                <IoIosClose size={22} />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {similarItems.map((item, i) => (
                <div key={i} className="border border-black/15 rounded-[8px] overflow-hidden bg-white">
                  <div className="aspect-[3/4] overflow-hidden">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3 grid gap-1">
                    {item.badge && <span className="text-xs text-red-600 font-semibold">{item.badge}</span>}
                    <p className="text-sm font-medium line-clamp-2">{item.title}</p>
                    <p className="text-sm font-semibold">₹ {item.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
