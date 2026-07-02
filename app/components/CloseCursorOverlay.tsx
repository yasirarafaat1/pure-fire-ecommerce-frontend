"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const CLOSE_CURSOR_SELECTOR = "[data-close-cursor='true']";

function isVisibleElement(element: Element) {
  if (!element.isConnected) return false;

  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;

  const styles = window.getComputedStyle(element);
  return (
    styles.display !== "none" &&
    styles.visibility !== "hidden" &&
    styles.pointerEvents !== "none" &&
    Number(styles.opacity || "1") > 0.01
  );
}

function getCloseCursorTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;

  const element = target.closest(CLOSE_CURSOR_SELECTOR);
  if (!element || !isVisibleElement(element)) return null;

  return element;
}

export default function CloseCursorOverlay() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const visibleRef = useRef(false);
  const pointerRef = useRef({ x: 0, y: 0 });
  const activeTargetRef = useRef<Element | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const setCursorVisible = (nextVisible: boolean) => {
      if (visibleRef.current === nextVisible) return;
      visibleRef.current = nextVisible;
      setVisible(nextVisible);
    };

    const paintCursor = () => {
      rafRef.current = null;
      const cursor = cursorRef.current;
      if (!cursor) return;

      cursor.style.transform = `translate3d(${pointerRef.current.x}px, ${pointerRef.current.y}px, 0) translate3d(-50%, -50%, 0)`;
    };

    const schedulePaint = () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(paintCursor);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== "mouse") {
        setCursorVisible(false);
        return;
      }

      pointerRef.current = { x: event.clientX, y: event.clientY };
      schedulePaint();
      activeTargetRef.current = getCloseCursorTarget(event.target);
      setCursorVisible(Boolean(activeTargetRef.current));
    };

    const hideCursor = () => {
      activeTargetRef.current = null;
      setCursorVisible(false);
    };

    const handlePointerDown = () => hideCursor();

    const handleScroll = () => {
      if (!activeTargetRef.current || !isVisibleElement(activeTargetRef.current)) {
        hideCursor();
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointercancel", hideCursor);
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    window.addEventListener("blur", hideCursor);
    document.addEventListener("visibilitychange", hideCursor);
    document.addEventListener("mouseleave", hideCursor);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointercancel", hideCursor);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("blur", hideCursor);
      document.removeEventListener("visibilitychange", hideCursor);
      document.removeEventListener("mouseleave", hideCursor);

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={cursorRef}
        aria-hidden="true"
        className={`pointer-events-none fixed left-0 top-0 z-[9999] grid h-11 w-11 will-change-transform place-items-center rounded-full border border-black bg-white text-black shadow-[0_12px_30px_rgba(0,0,0,0.24)] ring-1 ring-white/80 transition-opacity duration-100 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <X size={22} strokeWidth={2} />
      </div>

      <style jsx global>{`
        @media (pointer: fine) {
          [data-close-cursor="true"] {
            cursor: none !important;
          }
        }
      `}</style>
    </>
  );
}
