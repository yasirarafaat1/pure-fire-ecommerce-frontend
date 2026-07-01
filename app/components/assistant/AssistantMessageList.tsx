"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bot, UserRound } from "lucide-react";
import AssistantCardsRenderer from "./AssistantCardsRenderer";
import AssistantTyping from "./AssistantTyping";
import type { AssistantMessage } from "./types";

type LooseMessage = AssistantMessage &
  Record<string, unknown> & {
    createdAt?: string | number | Date;
    timestamp?: string | number | Date;
    time?: string | number | Date;
    avatar?: string;
    avatarUrl?: string;
    userAvatar?: string;
    userImage?: string;
  };

function getMessageDate(message: LooseMessage) {
  const raw = message.createdAt || message.timestamp || message.time;

  if (!raw) return new Date();

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) return new Date();

  return date;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getCalendarDayDiff(from: Date, to: Date) {
  const fromDay = startOfDay(from).getTime();
  const toDay = startOfDay(to).getTime();

  return Math.round((toDay - fromDay) / (1000 * 60 * 60 * 24));
}

function formatTime(date: Date) {
  return date
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace("AM", "am")
    .replace("PM", "pm");
}

function formatStickyDateTime(date: Date) {
  const now = new Date();
  const diff = getCalendarDayDiff(date, now);
  const time = formatTime(date);

  if (diff === 0) {
    return `Today ${time}`;
  }

  if (diff === 1) {
    return `Yesterday ${time}`;
  }

  if (diff > 1 && diff < 7) {
    const dayName = date.toLocaleDateString("en-US", {
      weekday: "long",
    });

    return `${dayName} ${time}`;
  }

  const dateLabel = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${dateLabel} ${time}`;
}

function shouldCreateTimeMarker(
  current: LooseMessage,
  previous?: LooseMessage,
  index?: number,
) {
  if (!previous || index === 0) return true;

  const currentDate = getMessageDate(current);
  const previousDate = getMessageDate(previous);

  const currentDay = startOfDay(currentDate).getTime();
  const previousDay = startOfDay(previousDate).getTime();

  if (currentDay !== previousDay) return true;

  const gap = Math.abs(currentDate.getTime() - previousDate.getTime());

  return gap > 1000 * 60 * 5;
}

function getUserAvatar(message: LooseMessage) {
  return (
    message.avatarUrl ||
    message.userAvatar ||
    message.userImage ||
    message.avatar ||
    ""
  );
}

export default function AssistantMessageList({
  messages,
  loading,
  error,
  onSend,
  onLookup,
  onReply,
}: {
  messages: AssistantMessage[];
  loading: boolean;
  error: string;
  onSend: (value: string) => void;
  onLookup: (orderId: string) => void;
  onReply: (message: AssistantMessage) => void;
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [activeTimeLabel, setActiveTimeLabel] = useState("");
  const [replyMenu, setReplyMenu] = useState<{
    message: AssistantMessage;
    x: number;
    y: number;
  } | null>(null);

  const list = useMemo(() => messages as LooseMessage[], [messages]);

  const firstTimeLabel = useMemo(() => {
    const firstMessage = list[0];
    return firstMessage ? formatStickyDateTime(getMessageDate(firstMessage)) : "";
  }, [list]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, error]);

  useEffect(() => {
    const root = rootRef.current;
    const scrollParent = root?.closest(".assistant-chat-scroll");

    if (!root || !(scrollParent instanceof HTMLElement)) return undefined;

    const updateActiveTime = () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = window.requestAnimationFrame(() => {
        const markers = Array.from(
          root.querySelectorAll<HTMLElement>("[data-time-marker='true']"),
        );

        if (!markers.length) {
          setActiveTimeLabel("");
          return;
        }

        const containerRect = scrollParent.getBoundingClientRect();
        const triggerY = containerRect.top + 18;

        let nextLabel = markers[0].dataset.timeLabel || firstTimeLabel;

        for (const marker of markers) {
          const markerTop = marker.getBoundingClientRect().top;

          if (markerTop <= triggerY) {
            nextLabel = marker.dataset.timeLabel || nextLabel;
          } else {
            break;
          }
        }

        setActiveTimeLabel((current) =>
          current === nextLabel ? current : nextLabel,
        );
      });
    };

    updateActiveTime();

    scrollParent.addEventListener("scroll", updateActiveTime, { passive: true });
    window.addEventListener("resize", updateActiveTime);

    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }

      scrollParent.removeEventListener("scroll", updateActiveTime);
      window.removeEventListener("resize", updateActiveTime);
    };
  }, [firstTimeLabel, list]);

  useEffect(() => {
    if (!replyMenu) return undefined;
    const close = () => setReplyMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [replyMenu]);

  const visibleStickyLabel = activeTimeLabel || firstTimeLabel;
  const showStickyTime = Boolean(visibleStickyLabel);

  return (
    <div ref={rootRef} className="assistant-message-list px-3 py-4">
      {showStickyTime ? (
        <div className="assistant-sticky-time sticky top-2 z-30 flex justify-center">
          <span className="sticky-time-chip">{visibleStickyLabel}</span>
        </div>
      ) : null}

      <div className="grid gap-4">
        {list.map((message, index) => {
          const user = message.role === "user";
          const messageKey = message.id || `${message.role}-${index}`;
          const previous = list[index - 1];
          const createTimeMarker = shouldCreateTimeMarker(message, previous, index);
          const date = getMessageDate(message);
          const stickyLabel = formatStickyDateTime(date);
          const userAvatar = getUserAvatar(message);

          return (
            <div key={messageKey} className="relative grid gap-2">
              {createTimeMarker ? (
                <div
                  aria-hidden="true"
                  className="time-marker"
                  data-time-marker="true"
                  data-time-label={stickyLabel}
                />
              ) : null}

              <div
                className={`flex w-full items-end gap-2 ${
                  user ? "justify-end" : "justify-start"
                }`}
              >
                {!user ? (
                  <div className="assistant-avatar assistant-avatar-bot">
                    <Bot size={16} strokeWidth={2.5} />
                  </div>
                ) : null}

                <div
                  className={`min-w-0 ${
                    user
                      ? "max-w-[78%] md:max-w-[76%]"
                      : "max-w-[86%] md:max-w-[84%]"
                  }`}
                >
                  <div
                    className={`message-bubble ${
                      user ? "message-bubble-user" : "message-bubble-assistant"
                    }`}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      setReplyMenu({
                        message: {
                          id: messageKey,
                          role: message.role,
                          content: message.content,
                          intent: message.intent,
                          cards: message.cards,
                          suggestions: message.suggestions,
                          createdAt: message.createdAt,
                        },
                        x: event.clientX,
                        y: event.clientY,
                      });
                    }}
                  >
                    {message.replyTo ? (
                      <div
                        className={`mb-2 rounded-[5px] border px-2 py-1 text-xs ${
                          user
                            ? "border-white/20 bg-white/10 text-white/80"
                            : "border-slate-200 bg-slate-50 text-slate-500"
                        }`}
                      >
                        <span className="block font-black">
                          Reply to {message.replyTo.role === "user" ? "you" : "assistant"}
                        </span>
                        <span className="mt-0.5 block max-w-[210px] truncate font-semibold">
                          {message.replyTo.content}
                        </span>
                      </div>
                    ) : null}
                    <p className="whitespace-pre-wrap break-words text-[14px] leading-[1.55]">
                      {message.content}
                    </p>
                  </div>

                  {!user ? (
                    <div
                      onContextMenu={(event) => {
                        event.preventDefault();
                        setReplyMenu({
                          message: {
                            id: messageKey,
                            role: message.role,
                            content: message.content,
                            intent: message.intent,
                            cards: message.cards,
                            suggestions: message.suggestions,
                            createdAt: message.createdAt,
                          },
                          x: event.clientX,
                          y: event.clientY,
                        });
                      }}
                    >
                      <AssistantCardsRenderer
                        cards={message.cards || []}
                        onLookup={onLookup}
                        loading={loading}
                      />

                      {Boolean(message.suggestions?.length) ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {message.suggestions?.slice(0, 4).map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => onSend(suggestion)}
                              className="suggestion-chip"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {user ? (
                  <div className="assistant-avatar assistant-avatar-user">
                    {userAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={userAvatar} alt="User" />
                    ) : (
                      <UserRound size={15} strokeWidth={2.5} />
                    )}
                  </div>
                ) : null}
              </div>

            </div>
          );
        })}

        {loading ? (
          <div className="flex items-end gap-2">
            <div className="assistant-avatar assistant-avatar-bot">
              <Bot size={16} strokeWidth={2.5} />
            </div>

            <AssistantTyping />
          </div>
        ) : null}

        {error ? (
          <div className="mx-auto max-w-[92%] rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      {typeof document !== "undefined" && replyMenu
        ? createPortal(
            <div
              className="fixed z-[9999] overflow-hidden rounded-[6px] border border-black/10 bg-white shadow-[0_16px_42px_rgba(15,23,42,0.18)]"
              style={{
                left: Math.min(replyMenu.x, window.innerWidth - 124),
                top: Math.min(replyMenu.y, window.innerHeight - 56),
              }}
              onClick={(event) => event.stopPropagation()}
              onContextMenu={(event) => event.preventDefault()}
            >
              <button
                type="button"
                className="px-4 py-2 text-sm font-black text-slate-900 hover:bg-slate-100"
                onClick={() => {
                  onReply(replyMenu.message);
                  setReplyMenu(null);
                }}
              >
                Reply
              </button>
            </div>,
            document.body,
          )
        : null}

      <style jsx>{`
        .assistant-message-list {
          min-height: 100%;
          background:
            radial-gradient(circle at top left, rgba(255, 255, 255, 0.9), transparent 34%),
            linear-gradient(180deg, #f8fafc 0%, #fbfaf8 42%, #ffffff 100%);
        }

        .assistant-sticky-time {
          pointer-events: none;
          margin-top: -4px;
          margin-bottom: 8px;
        }

        .time-marker {
          height: 1px;
          margin-top: -1px;
          pointer-events: none;
          visibility: hidden;
        }

        .sticky-time-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          max-width: calc(100% - 32px);
          border-radius: 999px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: rgba(255, 255, 255, 0.9);
          padding: 5px 12px;
          font-size: 11px;
          font-weight: 800;
          line-height: 1;
          color: rgba(71, 85, 105, 0.86);
          box-shadow:
            0 8px 22px rgba(15, 23, 42, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .assistant-avatar {
          display: grid;
          width: 30px;
          height: 30px;
          flex: 0 0 auto;
          place-items: center;
          overflow: hidden;
          border-radius: 999px;
        }

        .assistant-avatar-bot {
          background: rgb(23, 143, 23);
          color: #ffffff;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.18);
        }

        .assistant-avatar-user {
          background: #ffffff;
          color: #0f172a;
          border: 1px solid rgba(15, 23, 42, 0.1);
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
        }

        .assistant-avatar-user img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .message-bubble {
          position: relative;
          width: fit-content;
          max-width: 100%;
          padding: 11px 14px;
          box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
        }

        .message-bubble-assistant {
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 7px 7px 7px 0px;
          background: #ffffff;
          color: #020617;
        }

        .message-bubble-user {
          margin-left: auto;
          border-radius: 7px 7px 0px 7px;
          background: #020617;
          color: #ffffff;
          box-shadow: 0 10px 26px rgba(2, 6, 23, 0.22);
        }

        .suggestion-chip {
          border-radius: 7px;
          border: 1px solid rgba(15, 23, 42, 0.1);
          background: #ffffff;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 800;
          color: #1e293b;
          box-shadow: 0 5px 14px rgba(15, 23, 42, 0.05);
          transition:
            transform 180ms ease,
            border-color 180ms ease,
            background 180ms ease,
            color 180ms ease;
        }

        .suggestion-chip:hover {
          transform: translateY(-1px);
          border-color: #020617;
          background: #020617;
          color: #ffffff;
        }

        .suggestion-chip:active {
          transform: scale(0.98);
        }

        @media (max-width: 767px) {
          .assistant-message-list {
            padding-left: 12px;
            padding-right: 12px;
          }

          .assistant-sticky-time {
            top: 8px;
          }

          .sticky-time-chip {
            padding: 5px 10px;
            font-size: 10.5px;
          }

          .assistant-avatar {
            width: 28px;
            height: 28px;
          }

          .message-bubble {
            padding: 10px 13px;
          }
        }
      `}</style>
    </div>
  );
}
