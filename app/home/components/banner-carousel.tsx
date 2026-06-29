"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cachedFetch } from "../../utils/cachedFetch";

type Slide = { src: string; alt: string; href: string };

const placeholders: Slide[] = [
  { src: "", alt: "placeholder-1", href: "#" },
  { src: "", alt: "placeholder-2", href: "#" },
  { src: "", alt: "placeholder-3", href: "#" },
];

const visibleForWidth = (w: number) => {
  if (w >= 1024) return 3;
  if (w >= 640) return 2;
  return 1;
};

export default function BannerCarousel() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(1);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [index, setIndex] = useState(0);
  const [transition, setTransition] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [isCoarse, setIsCoarse] = useState(false);

  const wheelLockRef = useRef(false);
  const dragStartXRef = useRef<number | null>(null);
  const dragMovedRef = useRef(false);

  useEffect(() => {
    setMounted(true);

    const apply = () => setVisible(visibleForWidth(window.innerWidth));
    apply();

    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setIsCoarse(mq.matches);

    update();

    if (mq.addEventListener) mq.addEventListener("change", update);
    else mq.addListener(update);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update);
      else mq.removeListener(update);
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const cached = window.localStorage.getItem("banner_cache");

    if (cached) {
      try {
        const parsed: Slide[] = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length) setSlides(parsed);
      } catch {
        /* ignore */
      }
    }

    const load = async () => {
      try {
        const res = await cachedFetch(
          "/api/admin/banners/public",
          undefined,
          600000,
          true,
        );

        if (!res.ok) throw new Error("fail");

        const data = await res.json();

        const banners = (data?.banners || [])
          .filter((b: any) => b.imageUrl && b.targetUrl)
          .slice(0, 10)
          .map((b: any, i: number) => ({
            src: b.imageUrl,
            alt: b.title || `Banner ${i + 1}`,
            href: b.targetUrl,
          }));

        if (banners.length) {
          setSlides(banners);
          window.localStorage.setItem("banner_cache", JSON.stringify(banners));
        }
      } catch {
        /* ignore */
      }
    };

    load();
  }, [mounted]);

  const baseSlides = slides.length ? slides : placeholders;
  const cloneCount = Math.min(visible, baseSlides.length);

  const trackSlides = useMemo(() => {
    if (!baseSlides.length) return [];

    const beforeClones = baseSlides.slice(-cloneCount);
    const afterClones = baseSlides.slice(0, cloneCount);

    return [...beforeClones, ...baseSlides, ...afterClones];
  }, [baseSlides, cloneCount]);

  useEffect(() => {
    if (!mounted || !baseSlides.length) return;

    setTransition(false);
    setIndex(cloneCount);

    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setTransition(true));
    });

    return () => cancelAnimationFrame(raf);
  }, [mounted, baseSlides.length, cloneCount]);

  const step = (dir: 1 | -1) => {
    if (!baseSlides.length) return;

    setTransition(true);
    setIndex((prev) => prev + dir);
  };

  useEffect(() => {
    if (!mounted || !baseSlides.length) return;
    if (hovering) return;

    const id = setInterval(() => {
      step(1);
    }, 3200);

    return () => clearInterval(id);
  }, [mounted, baseSlides.length, hovering]);

  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== "transform") return;
    if (!baseSlides.length) return;

    const firstRealIndex = cloneCount;
    const lastRealIndex = cloneCount + baseSlides.length - 1;
    const afterCloneStart = cloneCount + baseSlides.length;

    if (index >= afterCloneStart) {
      setTransition(false);
      setIndex(firstRealIndex);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => setTransition(true));
      });

      return;
    }

    if (index < firstRealIndex) {
      setTransition(false);
      setIndex(lastRealIndex);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => setTransition(true));
      });
    }
  };

  const gapPx = 16;
  const translate = `translateX(-${index * (100 / visible)}%)`;
  const width = `calc(${100 / visible}% - ${gapPx - gapPx / visible}px)`;

  const activeDot = baseSlides.length
    ? ((index - cloneCount) % baseSlides.length + baseSlides.length) %
      baseSlides.length
    : 0;

  const onDot = (i: number) => {
    setTransition(true);
    setIndex(cloneCount + i);
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaX) < 10 && Math.abs(e.deltaY) < 10) return;
    if (wheelLockRef.current) return;

    wheelLockRef.current = true;

    const dir = e.deltaY > 0 || e.deltaX > 0 ? 1 : -1;
    step(dir);

    setTimeout(() => {
      wheelLockRef.current = false;
    }, 350);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    dragStartXRef.current = e.clientX;
    dragMovedRef.current = false;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartXRef.current === null) return;

    const delta = e.clientX - dragStartXRef.current;
    if (Math.abs(delta) > 12) dragMovedRef.current = true;
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const startX = dragStartXRef.current;

    if (startX === null) return;

    const delta = e.clientX - startX;
    dragStartXRef.current = null;

    if (Math.abs(delta) < 40) return;

    step(delta < 0 ? 1 : -1);
  };

  const onPointerCancel = () => {
    dragStartXRef.current = null;
  };

  if (!mounted) {
    return (
      <div className="mx-auto max-w-6xl pb-4 md:py-4">
        <div className="h-[227px] sm:h-[220px] md:h-[240px] rounded-[5px] border border-black/10 bg-black/5 animate-pulse" />
        <div className="mt-3 flex justify-center gap-2">
          {placeholders.map((slide) => (
            <span key={slide.alt} className="h-1 w-1.5 rounded-full bg-black/20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-4 md:py-4 space-y-3">
      <div
        className="relative overflow-hidden"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        style={{ touchAction: "pan-y" }}
      >
        <div
          className={`flex gap-0 lg:gap-40 ${
            transition ? "transition-transform duration-500 ease-out" : ""
          }`}
          style={{ transform: translate }}
          onTransitionEnd={handleTransitionEnd}
        >
          {trackSlides.map((slide, i) => (
            <div key={`${slide?.src || slide.alt}-${i}`} className="shrink-0" style={{ width }}>
              <div
                className="w-full h-[227px] w-[400px] sm:w-[300px] md:w-[500px] sm:h-[220px] md:h-[240px] gap-20 py-5 px-2 lg:p-0 cursor-pointer rounded-[5px] border border-black/10 overflow-hidden"
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (dragMovedRef.current) {
                    dragMovedRef.current = false;
                    return;
                  }

                  if (!isCoarse) return;

                  slide?.href && window.open(slide.href, "_self");
                }}
                onDoubleClick={() => slide?.href && window.open(slide.href, "_self")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && slide?.href) {
                    window.open(slide.href, "_self");
                  }
                }}
              >
                {slide?.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    className="w-full h-full object-cover rounded-[5px]"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-black/5 animate-pulse" aria-hidden />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-2">
        {baseSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => onDot(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1 rounded-full cursor-pointer transition-all ${
              i === activeDot ? "w-4 bg-black" : "w-1.5 bg-black/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
