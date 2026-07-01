"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const CLOSE_CURSOR_SELECTOR = "[data-close-cursor='true']";

function isCloseCursorTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest(CLOSE_CURSOR_SELECTOR));
}

export default function CloseCursorOverlay() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const visibleRef = useRef(false);
  const pointerRef = useRef({ x: 0, y: 0 });
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

      cursor.style.transform = `translate3d(${pointerRef.current.x}px, ${pointerRef.current.y}px, 0) translate(-50%, -50%)`;
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
      setCursorVisible(isCloseCursorTarget(event.target));
    };

    const hideCursor = () => setCursorVisible(false);

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerMove, { passive: true });
    window.addEventListener("blur", hideCursor);
    document.addEventListener("mouseleave", hideCursor);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerMove);
      window.removeEventListener("blur", hideCursor);
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
        className={`pointer-events-none fixed left-0 top-0 z-[9999] grid h-11 w-11 place-items-center rounded-full border-1 border-black bg-white text-black shadow-[0_12px_30px_rgba(0,0,0,0.24)] ring-1 ring-white/80 transition-opacity duration-100 ${
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
