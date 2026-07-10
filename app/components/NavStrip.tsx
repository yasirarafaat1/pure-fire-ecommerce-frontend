"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3 } from "lucide-react";

type NavStripItem = {
  _id?: string;
  text: string;
  textHtml?: string;
  hoverText?: string;
  href?: string;
  createdAt?: string;
  timer?: {
    enabled?: boolean;
    position?: "start" | "end";
    mode?: "loop" | "one_time";
    durationMinutes?: number;
    startAt?: string | null;
  };
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

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
  }

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getTimerRemaining(item: NavStripItem | null, now: number) {
  const timer = item?.timer;
  if (!timer?.enabled) return "";

  const durationMs = Math.max(1, Number(timer.durationMinutes || 60)) * 60 * 1000;
  const startMs = timer.startAt
    ? new Date(timer.startAt).getTime()
    : item?.createdAt
      ? new Date(item.createdAt).getTime()
      : now;

  if (!Number.isFinite(startMs)) return "";

  if (timer.mode === "one_time") {
    if (now < startMs) return formatRemaining(startMs - now);
    const endMs = startMs + durationMs;
    return formatRemaining(Math.max(0, endMs - now));
  }

  if (now < startMs) return formatRemaining(startMs - now);

  const elapsed = (now - startMs) % durationMs;
  return formatRemaining(durationMs - elapsed);
}

export default function NavStrip() {
  const [items, setItems] = useState<NavStripItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [durationSeconds, setDurationSeconds] = useState(4);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

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
  const timerText = useMemo(() => getTimerRemaining(activeItem, now), [activeItem, now]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

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
  const timerBadge = timerText ? (
    <span className="nav-strip-timer">
      <Clock3 size={13} strokeWidth={2.5} />
      <span>{timerText}</span>
    </span>
  ) : null;
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
            className={`inline-flex max-w-full items-center gap-2 underline decoration-white/70 decoration-2 underline-offset-4 transition-all duration-300 hover:text-amber-200 hover:decoration-amber-200 ${
              visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
            }`}
          >
            {activeItem.timer?.position !== "end" ? timerBadge : null}
            {content}
            {activeItem.timer?.position === "end" ? timerBadge : null}
          </a>
        ) : (
          <span
            className={`inline-flex max-w-full items-center gap-2 transition-all duration-300 ${
              visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
            }`}
          >
            {activeItem.timer?.position !== "end" ? timerBadge : null}
            {content}
            {activeItem.timer?.position === "end" ? timerBadge : null}
          </span>
        )}
      </div>

      <style jsx global>{`
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

        .nav-strip-rich a,
        .nav-strip-rich a:visited {
          color: inherit !important;
          border-bottom: 2px solid rgba(255, 255, 255, 0.78) !important;
          padding-bottom: 1px !important;
          text-decoration: none !important;
          transition:
            border-color 180ms ease,
            color 180ms ease !important;
        }

        .nav-strip-rich a:hover {
          border-color: #fde68a !important;
          color: #fde68a !important;
        }

        .nav-strip-rich [data-hover-color="true"] {
          transition: color 180ms ease;
        }

        .nav-strip-rich [data-hover-color="true"]:hover {
          color: var(--hover-color) !important;
        }

        .nav-strip-rich a[data-hover-color="true"]:hover,
        .nav-strip-rich a[style*="--hover-color"]:hover {
          border-color: var(--hover-color) !important;
          color: var(--hover-color) !important;
        }

        .nav-strip-timer {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          flex: 0 0 auto;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.28);
          background: rgba(255, 255, 255, 0.1);
          padding: 2px 7px;
          color: #ffffff;
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.04em;
        }
      `}</style>
    </div>
  );
}
