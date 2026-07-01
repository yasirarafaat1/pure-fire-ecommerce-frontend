"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BotMessageSquare, MessageSquareText, RefreshCw, Search, UserRound } from "lucide-react";
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

const shortId = (value: string) => (value.length > 14 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value);

export default function AdminAssistantPage() {
  const [range, setRange] = useState<RangeKey>("30d");
  const [search, setSearch] = useState("");
  const [sessions, setSessions] = useState<AssistantSessionRow[]>([]);
  const [analytics, setAnalytics] = useState<AssistantAnalytics | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ limit: "40" });
    if (search.trim()) params.set("search", search.trim());

    Promise.all([
      adminApi.get<{ data: { sessions: AssistantSessionRow[] } }>(`/assistant/sessions?${params.toString()}`),
      adminApi.get<{ data: AssistantAnalytics }>(`/assistant/analytics?range=${range}`),
    ])
      .then(([sessionResponse, analyticsResponse]) => {
        const rows = sessionResponse.data.sessions || [];
        setSessions(rows);
        setAnalytics(analyticsResponse.data);
        setSelectedSessionId((current) => current || rows[0]?.sessionId || "");
      })
      .catch((requestError) =>
        setError(requestError instanceof AdminApiError ? requestError.message : "Assistant history failed"),
      )
      .finally(() => setLoading(false));
  }, [range, search]);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!selectedSessionId) {
      return;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      setDetailLoading(true);
      adminApi
        .get<{ data: SessionDetail }>(`/assistant/sessions/${encodeURIComponent(selectedSessionId)}`)
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

  const cards = useMemo(() => {
    const kpis = analytics?.kpis;
    return [
      { label: "Sessions", value: kpis?.totalSessions || 0, icon: <BotMessageSquare size={18} /> },
      { label: "Messages", value: kpis?.totalMessages || 0, icon: <MessageSquareText size={18} /> },
      { label: "User Chats", value: kpis?.userSessions || 0, icon: <UserRound size={18} /> },
      { label: "Guest Chats", value: kpis?.guestSessions || 0, icon: <UserRound size={18} /> },
      { label: "Avg Messages", value: kpis?.averageMessagesPerSession || 0, icon: <MessageSquareText size={18} /> },
    ];
  }, [analytics]);

  if (error) return <AdminErrorState message={error} retry={load} />;
  if (loading || !analytics) return <AdminLoadingState label="Loading assistant history..." />;

  return (
    <div className="grid min-w-0 gap-6">
      <AdminPageHeader
        title="Assistant Chats"
        description="View shopping assistant conversations, intent usage, feedback, and session analytics."
        action={
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
            <select
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              value={range}
              onChange={(event) => setRange(event.target.value as RangeKey)}
            >
              {ranges.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            <button className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white" onClick={load}>
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-[0.16em]">{card.label}</span>
              {card.icon}
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">{card.value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
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
          <div className="max-h-[680px] overflow-y-auto p-2">
            {sessions.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-slate-500">No assistant chats found.</div>
            ) : (
              sessions.map((session) => {
                const active = selectedSessionId === session.sessionId;
                return (
                  <button
                    key={session.sessionId}
                    type="button"
                    onClick={() => setSelectedSessionId(session.sessionId)}
                    className={`grid w-full gap-2 rounded-xl p-3 text-left transition ${
                      active ? "bg-slate-950 text-white" : "hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold">{session.title || "Assistant Chat"}</span>
                      <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${active ? "bg-white/15" : "bg-slate-100 text-slate-600"}`}>
                        {session.messageCount}
                      </span>
                    </div>
                    <div className={`truncate text-xs ${active ? "text-white/75" : "text-slate-500"}`}>
                      {(session.userId || session.guestId || shortId(session.sessionId))} • {session.lastIntent || "unknown"} • {formatDate(session.lastMessageAt)}
                    </div>
                    <div className={`line-clamp-2 text-xs ${active ? "text-white/70" : "text-slate-500"}`}>
                      {session.lastMessage?.content || "No message preview"}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <h3 className="font-semibold text-slate-950">Conversation Record</h3>
            <p className="mt-1 text-xs text-slate-500">
              {detail?.session?.sessionId ? `${detail.session.title || "Assistant Chat"} • ${shortId(detail.session.sessionId)}` : "Select a chat to view messages."}
            </p>
          </div>
          {detailLoading ? (
            <AdminLoadingState label="Loading conversation..." />
          ) : !detail ? (
            <div className="px-4 py-12 text-center text-sm text-slate-500">No conversation selected.</div>
          ) : (
            <div className="grid gap-4 p-4">
              <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-3">
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-400">User</div>
                  <div className="mt-1 truncate font-medium">{detail.session.userId || "Guest"}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-400">Last Intent</div>
                  <div className="mt-1 truncate font-medium">{detail.session.lastIntent || "-"}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-400">Updated</div>
                  <div className="mt-1 truncate font-medium">{formatDate(detail.session.lastMessageAt)}</div>
                </div>
              </div>

              <div className="max-h-[560px] overflow-y-auto rounded-xl bg-slate-50 p-4">
                <div className="grid gap-3">
                  {detail.messages.map((message) => {
                    const user = message.role === "user";
                    return (
                      <div key={message._id} className={user ? "ml-auto max-w-[84%]" : "mr-auto max-w-[84%]"}>
                        <div className={`rounded-xl px-4 py-3 text-sm shadow-sm ${user ? "bg-slate-950 text-white" : "bg-white text-slate-950"}`}>
                          <div className="whitespace-pre-wrap">{message.content}</div>
                          <div className={`mt-2 text-[11px] ${user ? "text-white/60" : "text-slate-400"}`}>
                            {message.role} {message.intent ? `• ${message.intent}` : ""} • {formatDate(message.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-slate-950">Top Intents</h3>
          <div className="mt-4 grid gap-3">
            {analytics.intentBreakdown.map((row) => (
              <div key={row.intent} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <span>{row.intent}</span>
                <span className="font-semibold">{row.count}</span>
              </div>
            ))}
            {analytics.intentBreakdown.length === 0 && <p className="text-sm text-slate-500">No intent data yet.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-slate-950">Daily Messages</h3>
          <div className="mt-4 grid gap-3">
            {analytics.dailyMessages.map((row) => (
              <div key={row.date} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <span>{row.date}</span>
                <span className="font-semibold">{row.messages}</span>
              </div>
            ))}
            {analytics.dailyMessages.length === 0 && <p className="text-sm text-slate-500">No message activity yet.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
