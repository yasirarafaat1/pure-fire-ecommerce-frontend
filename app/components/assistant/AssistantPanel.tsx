"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Bot, Edit, MoreVertical } from "lucide-react";
import AssistantInput from "./AssistantInput";
import AssistantMessageList from "./AssistantMessageList";
import type { AssistantMessage, AssistantSessionSummary } from "./types";

function HistoryGridSkeleton() {
  return (
    <div className="grid gap-2 p-1" aria-label="Loading chat history">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="grid animate-pulse gap-2 rounded-[4px] border border-slate-100 bg-white px-3 py-2.5"
        >
          <div className="h-4 w-3/5 rounded-sm bg-slate-200" />
          <div className="grid grid-cols-[minmax(72px,0.45fr)_minmax(110px,1fr)] gap-2">
            <div className="h-3 rounded-sm bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AssistantPanel({
  open,
  messages,
  loading,
  error,
  onClose,
  onSend,
  onLookup,
  sessions,
  historyLoading,
  onRefreshHistory,
  onOpenHistory,
  onStartNewChat,
  replyTo,
  onReply,
  onCancelReply,
}: {
  open: boolean;
  messages: AssistantMessage[];
  loading: boolean;
  error: string;
  onClose: () => void;
  onSend: (value: string) => void;
  onLookup: (orderId: string) => void;
  sessions: AssistantSessionSummary[];
  historyLoading: boolean;
  onRefreshHistory: () => void;
  onOpenHistory: (sessionId: string) => void;
  onStartNewChat: () => void;
  replyTo?: AssistantMessage["replyTo"];
  onReply: (message: AssistantMessage) => void;
  onCancelReply: () => void;
}) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [mobileViewportHeight, setMobileViewportHeight] = useState(0);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const body = document.body;

    if (open) {
      root.classList.add("assistant-panel-open");
      body.classList.add("assistant-panel-open");
    } else {
      root.classList.remove("assistant-panel-open");
      body.classList.remove("assistant-panel-open");
    }

    return () => {
      root.classList.remove("assistant-panel-open");
      body.classList.remove("assistant-panel-open");
    };
  }, [open]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateViewportHeight = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      setMobileViewportHeight(Math.max(360, Math.floor(viewportHeight - 8)));
    };

    updateViewportHeight();
    window.visualViewport?.addEventListener("resize", updateViewportHeight);
    window.visualViewport?.addEventListener("scroll", updateViewportHeight);
    window.addEventListener("resize", updateViewportHeight);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateViewportHeight);
      window.visualViewport?.removeEventListener("scroll", updateViewportHeight);
      window.removeEventListener("resize", updateViewportHeight);
    };
  }, []);

  const panelStyle = {
    "--assistant-panel-mobile-height": `${mobileViewportHeight || 680}px`,
  } as CSSProperties;

  const toggleHistory = () => {
    setHistoryOpen((current) => {
      const next = !current;
      if (next) onRefreshHistory();
      return next;
    });
  };

  const formatSessionDate = (value?: string) => {
    if (!value) return "No date";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "No date";

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <div
        aria-hidden="true"
        data-close-cursor="true"
        onClick={onClose}
        className={`fixed inset-0 z-[43] bg-black/25 transition-all duration-300 md:bg-transparent ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Assistant"
        style={panelStyle}
        className={`assistant-panel fixed inset-x-0 bottom-0 z-[44] mx-auto flex h-[min(88dvh,var(--assistant-panel-mobile-height))] max-h-[var(--assistant-panel-mobile-height)] w-full flex-col overflow-hidden rounded-t-[22px] border border-black/10 bg-white shadow-[0_-22px_70px_rgba(0,0,0,0.22)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:inset-auto md:bottom-8 md:right-4 md:mx-0 md:h-[min(680px,calc(100dvh-50px))] md:max-h-[780px] md:w-[410px] md:rounded-[4px] md:shadow-[0_28px_90px_rgba(0,0,0,0.24)] ${
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100 blur-0"
            : "pointer-events-none translate-y-[105%] scale-[0.98] opacity-0 blur-[1px] md:translate-y-8 md:scale-[0.94]"
        }`}
      >
        {historyOpen && open ? (
          <button
            type="button"
            aria-label="Close chat history"
            onClick={() => setHistoryOpen(false)}
            className="absolute inset-x-0 bottom-0 top-[74px] z-30 cursor-default bg-white/30"
          />
        ) : null}

        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[4px] bg-[#fbfaf8]">
          <header className="assistant-header relative z-40 shrink-0 overflow-visible border-b border-black/10 bg-white px-4 py-3.5">
            <div className="pointer-events-none absolute inset-0 rounded-t-[inherit] bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_34%),linear-gradient(135deg,#ffffff,#fffaf0_55%,#f8fafc)]" />

            <div className="relative z-10 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="assistant-brand-icon relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[4px] bg-green-700 text-white shadow-[0_12px_26px_rgba(15,23,42,0.22)] ring-1 ring-black/10">
                  <Bot size={22} strokeWidth={2.45} />
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-[15px] font-black leading-5 tracking-[-0.01em] text-slate-950">
                    Shopping Assistant
                  </h3>

                  <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                    Products, orders & support
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  aria-label="Start new chat"
                  onClick={() => {
                    setHistoryOpen(false);
                    onStartNewChat();
                  }}
                  className="grid h-10 w-8 cursor-pointer place-items-center text-slate-900 transition"
                >
                  <Edit size={18} />
                </button>

                <button
                  type="button"
                  aria-label="Open chat history"
                  aria-expanded={historyOpen}
                  onClick={toggleHistory}
                  className="grid h-10 w-8 cursor-pointer place-items-center text-slate-900 transition"
                >
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            {historyOpen && open ? (
              <div className="assistant-history-dropdown absolute left-0 right-0 top-[calc(100%+0px)] z-[999] overflow-hidden rounded-b-[4px] border border-black/10 bg-white shadow-sm ring-1 ring-black/[0.03]">

                <div className="max-h-[320px] overflow-y-auto p-2">
                  {historyLoading ? (
                    <HistoryGridSkeleton />
                  ) : null}

                  {!historyLoading && sessions.length === 0 ? (
                    <div className="px-3 py-6 text-center text-xs font-semibold text-[var(--muted)]">
                      No saved chats yet.
                    </div>
                  ) : null}

                  {!historyLoading
                    ? sessions.map((session) => (
                        <button
                          key={session.sessionId}
                          type="button"
                          onClick={() => {
                            onOpenHistory(session.sessionId);
                            setHistoryOpen(false);
                          }}
                          className="grid w-full gap-1 rounded-[4px] cursor-pointer px-3 py-2.5 text-left transition hover:bg-slate-100 active:scale-[0.99]"
                        >
                          <span className="truncate text-sm font-black text-slate-950">
                            {session.title || "Assistant chat"}
                          </span>

                          <span className="truncate text-xs font-semibold text-slate-500">
                            {formatSessionDate(session.lastMessageAt || session.createdAt)}
                          </span>
                        </button>
                      ))
                    : null}
                </div>
              </div>
            ) : null}
          </header>

          {/* <div className={`assistant-quick-actions-wrap shrink-0 overflow-hidden border-b border-black/5 bg-white/90 backdrop-blur transition duration-200 ${historyOpen ? "blur-[2px]" : ""}`}>
            <AssistantQuickActions onSend={onSend} />
          </div> */}

          <main className={`assistant-chat-scroll scrollbar-hide min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth bg-[#fbfaf8] transition duration-200 ${historyOpen ? "blur-[2px]" : ""}`}>
            <div className="min-h-full">
              <AssistantMessageList
                messages={messages}
                loading={loading}
                error={error}
                onSend={onSend}
                onLookup={onLookup}
                onReply={onReply}
              />
            </div>
          </main>

          <div className={`assistant-input-safe shrink-0 border-t border-black/10 bg-white transition duration-200 ${historyOpen ? "blur-[2px]" : ""}`}>
            <AssistantInput disabled={loading} onSend={onSend} replyTo={replyTo} onCancelReply={onCancelReply} />
          </div>
        </div>

        <style jsx>{`
          .assistant-panel {
            transform-origin: bottom center;
          }

          @media (min-width: 768px) {
            .assistant-panel {
              transform-origin: bottom right;
            }
          }

          .assistant-brand-icon::before {
            content: "";
            position: absolute;
            inset: -40%;
            background: linear-gradient(
              120deg,
              transparent 35%,
              rgba(255, 255, 255, 0.22),
              transparent 65%
            );
            transform: translateX(-120%) rotate(18deg);
            transition: transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
          }

          .assistant-panel:hover .assistant-brand-icon::before {
            transform: translateX(120%) rotate(18deg);
          }

          .assistant-chat-scroll {
            scrollbar-width: none;
            -ms-overflow-style: none;
            -webkit-overflow-scrolling: touch;
          }

          .assistant-chat-scroll::-webkit-scrollbar {
            display: none;
            width: 0;
            height: 0;
          }

          .assistant-history-dropdown {
            animation: historyDropdownIn 180ms cubic-bezier(0.22, 1, 0.36, 1);
            transform-origin: top center;
          }

          @keyframes historyDropdownIn {
            from {
              transform: translateY(-6px) scale(0.98);
              opacity: 0;
            }

            to {
              transform: translateY(0) scale(1);
              opacity: 1;
            }
          }

          .assistant-input-safe {
            padding-bottom: max(0px, env(safe-area-inset-bottom));
          }

          @media (max-width: 767px) {
            .assistant-input-safe {
              padding-bottom: max(8px, env(safe-area-inset-bottom));
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .assistant-panel,
            .assistant-brand-icon::before,
            .assistant-panel *,
            .assistant-history-dropdown {
              transition: none !important;
              animation: none !important;
            }
          }
        `}</style>

        <style jsx global>{`
          .assistant-panel,
          .assistant-panel *,
          .assistant-panel *::before,
          .assistant-panel *::after {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }

          .assistant-panel::-webkit-scrollbar,
          .assistant-panel *::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }

          .assistant-panel [class*="scroll"],
          .assistant-panel [class*="overflow"],
          .assistant-panel .scrollbar-hide {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }

          .assistant-panel [class*="scroll"]::-webkit-scrollbar,
          .assistant-panel [class*="overflow"]::-webkit-scrollbar,
          .assistant-panel .scrollbar-hide::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }

          @media (max-width: 767px) {
            html.assistant-panel-open,
            body.assistant-panel-open {
              overflow: hidden !important;
              overscroll-behavior: none;
            }

            html.assistant-panel-open button[aria-label="Close assistant"],
            body.assistant-panel-open button[aria-label="Close assistant"],
            html.assistant-panel-open .assistant-launcher,
            body.assistant-panel-open .assistant-launcher,
            html.assistant-panel-open .assistant-launcher-button,
            body.assistant-panel-open .assistant-launcher-button,
            html.assistant-panel-open [data-assistant-launcher="true"],
            body.assistant-panel-open [data-assistant-launcher="true"] {
              display: none !important;
              opacity: 0 !important;
              pointer-events: none !important;
              visibility: hidden !important;
            }
          }
        `}</style>
      </div>
    </>
  );
}
