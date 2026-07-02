"use client";

import { useEffect } from "react";
import Lenis from "lenis";

const LENIS_PREVENT_SELECTOR = [
  "[data-lenis-prevent]",
  "[data-smooth-scroll-ignore='true']",
  "input",
  "textarea",
  "select",
  "[contenteditable='true']",
].join(",");

function shouldPreventLenis(node: HTMLElement) {
  return Boolean(node.closest(LENIS_PREVENT_SELECTOR));
}

export default function SmoothScrollProvider() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const desktopViewport = window.matchMedia("(min-width: 1024px)").matches;

    if (reduceMotion || coarsePointer || !desktopViewport) return undefined;

    const lenis = new Lenis({
      autoRaf: true,
      smoothWheel: true,
      syncTouch: false,
      allowNestedScroll: true,
      overscroll: false,
      anchors: {
        offset: -88,
        duration: 0.75,
      },
      lerp: 0.14,
      wheelMultiplier: 1,
      touchMultiplier: 1,
      prevent: shouldPreventLenis,
    });

    (window as Window & { appLenis?: Lenis }).appLenis = lenis;
    document.documentElement.classList.add("lenis-enabled");

    let resizeTimer = 0;
    const refresh = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => lenis.resize(), 120);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) lenis.stop();
      else lenis.start();
    };

    window.addEventListener("resize", refresh);
    window.addEventListener("orientationchange", refresh);
    window.addEventListener("modal:open", refresh as EventListener);
    window.addEventListener("cart:open", refresh as EventListener);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("resize", refresh);
      window.removeEventListener("orientationchange", refresh);
      window.removeEventListener("modal:open", refresh as EventListener);
      window.removeEventListener("cart:open", refresh as EventListener);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearTimeout(resizeTimer);
      document.documentElement.classList.remove("lenis-enabled");
      lenis.destroy();
      delete (window as Window & { appLenis?: Lenis }).appLenis;
    };
  }, []);

  return null;
}
