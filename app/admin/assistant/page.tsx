"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BotMessageSquare,
  Clock3,
  Eye,
  MessageSquareText,
  RefreshCw,
  Search,
  UserRound,
  X,
} from "lucide-react";
import AdminPageHeader from "../components/AdminPageHeader";
import { AdminErrorState, AdminLoadingState } from "../components/AdminStates";
import { AdminApiError, adminApi } from "../lib/adminApi";

type RangeKey = "7d" | "30d" | "90d";

type AssistantSessionRow = {
  sessionId: string;
  title?: string;
  userId?: string | null;
  guestId?: string | null;
  status: "active" | "closed";
  source?: string;
  lastIntent?: string | null;
  lastMessageAt?: string;
  createdAt?: string;
  messageCount: number;
  lastMessage?: { content?: string; role?: string; createdAt?: string } | null;
};

type AssistantMessageRow = {
  _id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  intent?: string | null;
  cards?: unknown[];
  suggestions?: unknown[];
  createdAt?: string;
  metadata?: { latencyMs?: number; model?: string | null } | null;
};

type AssistantAnalytics = {
  range: RangeKey;
  kpis: {
    totalSessions: number;
    totalMessages: number;
    activeSessions: number;
    userSessions: number;
    guestSessions: number;
    averageMessagesPerSession: number;
  };
  intentBreakdown: Array<{ intent: string; count: number }>;
  dailyMessages: Array<{ date: string; messages: number }>;
  feedbackBreakdown: Array<{ rating: string; count: number }>;
};

type SessionDetail = {
  session: AssistantSessionRow;
  messages: AssistantMessageRow[];
  feedback: Array<{ rating: string; comment?: string; createdAt?: string }>;
};

const ranges: Array<{ label: string; value: RangeKey }> = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
];

const formatDate = (value?: string) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const shortId = (value: string) =>
  value.length > 14 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;

const roleLabel = (role: AssistantMessageRow["role"]) => {
  if (role === "assistant") return "Assistant";
  if (role === "user") return "User";
  if (role === "tool") return "Tool";
  return "System";
};

const getSessionOwner = (session?: AssistantSessionRow | null) => {
  if (!session) return "-";
  if (session.userId) return session.userId;
  if (session.guestId) return `Guest: ${shortId(session.guestId)}`;
  return `Session: ${shortId(session.sessionId)}`;
};

function ChatViewModal({
  open,
  detail,
  loading,
  onClose,
}: {
  open: boolean;
  detail: SessionDetail | null;
  loading: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const session = detail?.session;
  const messages = detail?.messages || [];

  return (
    <div className="fixed inset-0 z-[90]">
      <button
        type="button"
        aria-label="Close chat view overlay"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
      />

      <div className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] min-h-[82dvh] flex-col overflow-hidden rounded-t-3xl border border-white/20 bg-white shadow-[0_-24px_90px_rgba(15,23,42,0.32)] md:inset-6 md:mx-auto md:h-[calc(100dvh-48px)] md:min-h-0 md:w-[min(1120px,calc(100vw-48px))] md:rounded-[4px]">
        <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 md:px-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[4px] bg-slate-950 text-white shadow-sm">
                  <MessageSquareText size={18} />
                </span>

                <div className="min-w-0">
                  <h2 className="truncate text-lg font-black text-slate-950">
                    {session?.title || "Assistant Chat"}
                  </h2>

                  <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                    {session?.sessionId
                      ? `${shortId(session.sessionId)} • ${getSessionOwner(session)}`
                      : "Loading conversation details..."}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              aria-label="Close chat view"
              onClick={onClose}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-950 hover:bg-slate-950 hover:text-white active:scale-95"
            >
              <X size={18} strokeWidth={2.4} />
            </button>
          </div>

          {session ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-4">
              <div className="rounded-[4px] bg-slate-50 px-3 py-2">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Status
                </div>
                <div className="mt-1 text-sm font-bold capitalize text-slate-950">
                  {session.status || "-"}
                </div>
              </div>

              <div className="rounded-[4px] bg-slate-50 px-3 py-2">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Intent
                </div>
                <div className="mt-1 truncate text-sm font-bold text-slate-950">
                  {session.lastIntent || "-"}
                </div>
              </div>

              <div className="rounded-[4px] bg-slate-50 px-3 py-2">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Messages
                </div>
                <div className="mt-1 text-sm font-bold text-slate-950">
                  {session.messageCount || messages.length || 0}
                </div>
              </div>

              <div className="rounded-[4px] bg-slate-50 px-3 py-2">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Updated
                </div>
                <div className="mt-1 truncate text-sm font-bold text-slate-950">
                  {formatDate(session.lastMessageAt || session.createdAt)}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,#f8fafc,#ffffff)] p-4 md:p-5">
          {loading ? (
            <div className="flex h-full min-h-[280px] items-center justify-center">
              <div className="rounded-[4px] border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-500 shadow-sm">
                Loading conversation...
              </div>
            </div>
          ) : !detail ? (
            <div className="flex h-full min-h-[280px] items-center justify-center">
              <div className="rounded-[4px] border border-slate-200 bg-white px-5 py-4 text-center text-sm font-bold text-slate-500 shadow-sm">
                No conversation selected.
              </div>
            </div>
          ) : (
            <div className="mx-auto grid max-w-4xl gap-4">
              {messages.length === 0 ? (
                <div className="rounded-[4px] border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm font-semibold text-slate-500">
                  No messages found in this chat.
                </div>
              ) : null}

              {messages.map((message) => {
                const user = message.role === "user";
                const assistant = message.role === "assistant";

                return (
                  <div
                    key={message._id}
                    className={`flex w-full items-end gap-3 ${
                      user ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!user ? (
                      <div
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full shadow-sm ${
                          assistant
                            ? "bg-slate-950 text-white"
                            : "border border-slate-200 bg-white text-slate-500"
                        }`}
                      >
                        {assistant ? (
                          <BotMessageSquare size={17} />
                        ) : (
                          <MessageSquareText size={16} />
                        )}
                      </div>
                    ) : null}

                    <div className={user ? "max-w-[82%] md:max-w-[72%]" : "max-w-[86%] md:max-w-[74%]"}>
                      <div
                        className={`rounded-[4px] px-4 py-3 text-sm shadow-sm ${
                          user
                            ? "rounded-br-md bg-slate-950 text-white"
                            : "rounded-bl-md border border-slate-200 bg-white text-slate-950"
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words leading-6">
                          {message.content || "-"}
                        </div>

                        <div
                          className={`mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold ${
                            user ? "text-white/60" : "text-slate-400"
                          }`}
                        >
                          <span>{roleLabel(message.role)}</span>
                          {message.intent ? <span>• {message.intent}</span> : null}
                          <span>• {formatDate(message.createdAt)}</span>
                          {message.metadata?.latencyMs ? (
                            <span>• {message.metadata.latencyMs}ms</span>
                          ) : null}
                          {message.metadata?.model ? (
                            <span>• {message.metadata.model}</span>
                          ) : null}
                        </div>
                      </div>

                      {message.cards?.length ? (
                        <div className="mt-2 rounded-[4px] border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500">
                          {message.cards.length} card{message.cards.length > 1 ? "s" : ""} returned
                        </div>
                      ) : null}

                      {message.suggestions?.length ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {message.suggestions.slice(0, 6).map((suggestion, index) => (
                            <span
                              key={`${message._id}-suggestion-${index}`}
                              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600"
                            >
                              {String(suggestion)}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    {user ? (
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm">
                        <UserRound size={17} />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminAssistantPage() {
  const [range, setRange] = useState<RangeKey>("30d");
  const [search, setSearch] = useState("");
  const [sessions, setSessions] = useState<AssistantSessionRow[]>([]);
  const [analytics, setAnalytics] = useState<AssistantAnalytics | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");

    const params = new URLSearchParams({ limit: "80" });

    if (search.trim()) params.set("search", search.trim());

    Promise.all([
      adminApi.get<{ data: { sessions: AssistantSessionRow[] } }>(
        `/assistant/sessions?${params.toString()}`,
      ),
      adminApi.get<{ data: AssistantAnalytics }>(`/assistant/analytics?range=${range}`),
    ])
      .then(([sessionResponse, analyticsResponse]) => {
        const rows = sessionResponse.data.sessions || [];

        setSessions(rows);
        setAnalytics(analyticsResponse.data);
        setSelectedSessionId((current) =>
          current && rows.some((row) => row.sessionId === current) ? current : "",
        );
      })
      .catch((requestError) =>
        setError(
          requestError instanceof AdminApiError
            ? requestError.message
            : "Assistant history failed",
        ),
      )
      .finally(() => setLoading(false));
  }, [range, search]);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!selectedSessionId) {
      setDetail(null);
      return undefined;
    }

    let active = true;

    const timer = window.setTimeout(() => {
      setDetailLoading(true);

      adminApi
        .get<{ data: SessionDetail }>(
          `/assistant/sessions/${encodeURIComponent(selectedSessionId)}`,
        )
        .then((response) => {
          if (active) setDetail(response.data);
        })
        .catch(() => {
          if (active) setDetail(null);
        })
        .finally(() => {
          if (active) setDetailLoading(false);
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [selectedSessionId]);

  const openChat = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setChatModalOpen(true);
  };

  const cards = useMemo(() => {
    const kpis = analytics?.kpis;

    return [
      {
        label: "Sessions",
        value: kpis?.totalSessions || 0,
        icon: <BotMessageSquare size={18} />,
      },
      {
        label: "Messages",
        value: kpis?.totalMessages || 0,
        icon: <MessageSquareText size={18} />,
      },
      {
        label: "User Chats",
        value: kpis?.userSessions || 0,
        icon: <UserRound size={18} />,
      },
      {
        label: "Guest Chats",
        value: kpis?.guestSessions || 0,
        icon: <UserRound size={18} />,
      },
      {
        label: "Avg Messages",
        value: kpis?.averageMessagesPerSession || 0,
        icon: <MessageSquareText size={18} />,
      },
    ];
  }, [analytics]);

  if (error) return <AdminErrorState message={error} retry={load} />;
  if (loading || !analytics) return <AdminLoadingState label="Loading assistant history..." />;

  return (
    <>
      <div className="grid min-w-0 gap-6">
        <AdminPageHeader
          title="Assistant Chats"
          description="View shopping assistant conversations, intent usage, feedback, and session analytics."
          action={
            <div className="flex flex-wrap items-center gap-2 rounded-[4px] border border-slate-200 bg-white p-2 shadow-sm">
              <select
                className="rounded-[4px] border border-slate-300 bg-white px-3 py-2 text-sm"
                value={range}
                onChange={(event) => setRange(event.target.value as RangeKey)}
              >
                {ranges.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-[4px] bg-slate-950 px-3 py-2 text-sm font-medium text-white"
                onClick={load}
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          }
        />

        <section className="grid gap-4 sm:grid-cols-5 xl:grid-cols-5">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                  {card.label}
                </span>
                {card.icon}
              </div>

              <div className="mt-3 text-2xl font-semibold text-slate-950">
                {card.value}
              </div>
            </div>
          ))}
        </section>

        <section className="min-w-0 rounded-[4px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="font-semibold text-slate-950">Chat Sessions</h3>
              <p className="mt-1 text-xs text-slate-500">
                Open any session to view the complete chat list in a modal.
              </p>
            </div>

            <label className="flex w-full items-center gap-2 rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-2 lg:max-w-sm">
              <Search size={16} className="text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") load();
                }}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                placeholder="Search session, user, guest, intent"
              />
            </label>
          </div>

          <div className="grid gap-2 p-3">
            {sessions.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-slate-500">
                No assistant chats found.
              </div>
            ) : null}

            {sessions.map((session) => {
              
              const latestMessage = session.lastMessage?.content || "No message preview";

              return (
                <button
                  key={session.sessionId}
                  type="button"
                  onClick={() => openChat(session.sessionId)}
                  className="group grid w-full gap-3 cursor-pointer rounded-[4px] border border-slate-200 bg-white p-4 text-left transition hover:border-slate-950 hover:shadow-[0_18px_42px_rgba(15,23,42,0.10)] active:scale-[0.995] lg:grid-cols-[1fr_auto]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-black text-slate-950">
                        {session.title || "Assistant Chat"}
                      </span>

                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold capitalize text-emerald-600">
                        {session.status}
                      </span>

                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">
                        {session.messageCount} messages
                      </span>
                    </div>

                    <div className="mt-2 grid gap-1 text-xs text-slate-500 sm:grid-cols-[1fr_auto]">
                      <span className="truncate">
                        {getSessionOwner(session)} • {session.lastIntent || "unknown"}
                      </span>

                      <span className="inline-flex items-center gap-1 font-semibold">
                        <Clock3 size={13} />
                        {formatDate(session.lastMessageAt || session.createdAt)}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                      {latestMessage}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="font-semibold text-slate-950">Top Intents</h3>

            <div className="mt-4 grid gap-3">
              {analytics.intentBreakdown.map((row) => (
                <div
                  key={row.intent}
                  className="flex items-center justify-between rounded-[4px] bg-slate-50 px-3 py-2 text-sm"
                >
                  <span>{row.intent}</span>
                  <span className="font-semibold">{row.count}</span>
                </div>
              ))}

              {analytics.intentBreakdown.length === 0 ? (
                <p className="text-sm text-slate-500">No intent data yet.</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="font-semibold text-slate-950">Daily Messages</h3>

            <div className="mt-4 grid gap-3">
              {analytics.dailyMessages.map((row) => (
                <div
                  key={row.date}
                  className="flex items-center justify-between rounded-[4px] bg-slate-50 px-3 py-2 text-sm"
                >
                  <span>{row.date}</span>
                  <span className="font-semibold">{row.messages}</span>
                </div>
              ))}

              {analytics.dailyMessages.length === 0 ? (
                <p className="text-sm text-slate-500">No message activity yet.</p>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      <ChatViewModal
        open={chatModalOpen}
        detail={detail}
        loading={detailLoading}
        onClose={() => setChatModalOpen(false)}
      />
    </>
  );
}
