"use client";

import { useEffect, useMemo, useState } from "react";

type NavStripItem = {
  _id?: string;
  text: string;
  textHtml?: string;
  hoverText?: string;
  href?: string;
};

type NavStripResponse = {
  status?: boolean;
  data?: NavStripItem[];
  settings?: {
    durationSeconds?: number;
  };
};

function normalizeDuration(value?: number) {
  if (!Number.isFinite(Number(value))) return 4000;
  return Math.min(10, Math.max(1, Math.round(Number(value)))) * 1000;
}

export default function NavStrip() {
  const [items, setItems] = useState<NavStripItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [durationSeconds, setDurationSeconds] = useState(4);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetch("/api/user/nav-strip", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: NavStripResponse) => {
        if (!mounted) return;
        const nextItems = (payload.data || []).filter((item) => item.text?.trim());
        setItems(nextItems);
        setDurationSeconds(Math.min(10, Math.max(1, Number(payload.settings?.durationSeconds || 4))));
        setActiveIndex(0);
      })
      .catch(() => {
        if (mounted) setItems([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const activeItem = items[activeIndex] || null;
  const duration = useMemo(() => normalizeDuration(durationSeconds), [durationSeconds]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("navstrip:visibility", {
        detail: { visible: loading || items.length > 0 },
      }),
    );
  }, [items.length, loading]);

  useEffect(() => {
    if (items.length <= 1) return undefined;

    let fadeTimer: number | undefined;
    const timer = window.setTimeout(() => {
      setVisible(false);

      fadeTimer = window.setTimeout(() => {
        setActiveIndex((current) => (current + 1) % items.length);
        setVisible(true);
      }, 220);
    }, duration);

    return () => {
      window.clearTimeout(timer);
      if (fadeTimer) window.clearTimeout(fadeTimer);
    };
  }, [duration, items.length, activeIndex]);

  if (loading) {
    return (
      <div className="sticky top-0 z-[41] h-8 border-b border-slate-900/10 bg-slate-950" />
    );
  }

  if (!activeItem) return null;

  const richContent = activeItem.textHtml?.trim();
  const content = richContent ? (
    <span
      className="nav-strip-rich"
      dangerouslySetInnerHTML={{ __html: richContent }}
    />
  ) : (
    <span className="group/navstrip relative inline-grid max-w-full overflow-hidden align-middle">
      <span className="col-start-1 row-start-1 truncate transition-opacity duration-200 group-hover/navstrip:opacity-0">
        {activeItem.text}
      </span>
      <span className="col-start-1 row-start-1 truncate opacity-0 transition-opacity duration-200 group-hover/navstrip:opacity-100">
        {activeItem.hoverText || activeItem.text}
      </span>
    </span>
  );

  return (
    <div className="sticky top-0 z-[41] border-b border-slate-900/10 bg-slate-950 text-white">
      <div className="mx-auto flex h-8 max-w-7xl items-center justify-center px-4 text-center text-[11px] font-black uppercase tracking-[0.16em] sm:text-xs">
        {activeItem.href && !richContent ? (
          <a
            href={activeItem.href}
            className={`max-w-full transition-all duration-300 hover:text-amber-200 ${
              visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
            }`}
          >
            {content}
          </a>
        ) : (
          <span
            className={`max-w-full transition-all duration-300 ${
              visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
            }`}
          >
            {content}
          </span>
        )}
      </div>

      <style jsx>{`
        .nav-strip-rich {
          display: inline-flex;
          max-width: 100%;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .nav-strip-rich :global(a) {
          color: inherit;
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: color 180ms ease;
        }

        .nav-strip-rich :global(a:hover) {
          color: #fde68a;
        }

        .nav-strip-rich :global([data-hover-color="true"]) {
          transition: color 180ms ease;
        }

        .nav-strip-rich :global([data-hover-color="true"]:hover) {
          color: var(--hover-color) !important;
        }

        .nav-strip-rich :global(a[data-hover-color="true"]:hover) {
          color: var(--hover-color) !important;
        }
      `}</style>
    </div>
  );
}
