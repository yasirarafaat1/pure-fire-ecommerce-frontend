"use client";

import { useEffect, useRef } from "react";
import { Bot } from "lucide-react";

export default function AssistantLauncher({
  open,
  onClick,
  productPage = false,
}: {
  open: boolean;
  onClick: () => void;
  productPage?: boolean;
}) {
  const autoOpenedRef = useRef(false);

  useEffect(() => {
    if (autoOpenedRef.current) return;

    autoOpenedRef.current = true;

    if (open) return;

    const timer = window.setTimeout(() => {
      onClick();
    }, 450);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open, onClick]);

  return (
    <button
      type="button"
      data-assistant-launcher="true"
      aria-label="Open shopping assistant"
      onClick={onClick}
      className={`assistant-launcher-button fixed right-4 z-[45] h-14 w-14 place-items-center rounded-full bg-green-700 text-white shadow-[0_18px_45px_rgba(15,23,42,0.28)] transition md:right-5 ${
        productPage ? "bottom-20 md:bottom-20" : "bottom-5 md:bottom-5"
      } ${
        open ? "hidden" : "grid"
      }`}
    >
      <Bot size={23} />
    </button>
  );
}
