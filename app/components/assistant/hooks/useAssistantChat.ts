"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { assistantGet, assistantPost } from "../assistant-api";
import type { AssistantApiResponse, AssistantMessage, AssistantSessionSummary } from "../types";

const initialMessage: AssistantMessage = {
  id: "welcome",
  role: "assistant",
  content: "Hi, I can help you find products, track orders, and answer shopping questions.",
  suggestions: ["Find products", "Track order", "Best sellers", "Return policy"],
  cards: [],
};

export const useAssistantChat = ({
  sessionId,
  guestId,
  ensureSession,
  startNewSession,
  setActiveSession,
}: {
  sessionId: string;
  guestId: string;
  ensureSession: () => Promise<string>;
  startNewSession: () => Promise<string>;
  setActiveSession: (sessionId: string) => void;
}) => {
  const pathname = usePathname();
  const [messages, setMessages] = useState<AssistantMessage[]>([initialMessage]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState<AssistantSessionSummary[]>([]);

  const appendAssistantResponse = (data: AssistantApiResponse) => {
    setMessages((current) => [
      ...current,
      {
        id: String(data.messageId || `assistant_${Date.now()}`),
        role: "assistant",
        content: data.message || "",
        intent: data.intent,
        cards: data.cards || [],
        suggestions: data.suggestions || [],
      },
    ]);
  };

  const addAssistantNotice = useCallback((content: string, suggestions: string[] = []) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    setMessages((current) => [
      ...current,
      {
        id: `assistant_notice_${Date.now()}`,
        role: "assistant",
        content: trimmed,
        cards: [],
        suggestions,
      },
    ]);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      setError("");
      setMessages((current) => [
        ...current,
        { id: `user_${Date.now()}`, role: "user", content: trimmed },
      ]);
      setLoading(true);
      try {
        const activeSessionId = sessionId || (await ensureSession());
        const data = await assistantPost<AssistantApiResponse>("/message", {
          sessionId: activeSessionId,
          guestId,
          message: trimmed,
          context: {
            currentPath: pathname || "/",
            cartId: localStorage.getItem("cart_id") || "",
          },
        });
        appendAssistantResponse(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Assistant failed");
      } finally {
        setLoading(false);
      }
    },
    [ensureSession, guestId, loading, pathname, sessionId],
  );

  const lookupOrder = useCallback(
    async (orderId: string) => {
      const trimmed = orderId.trim();
      if (!trimmed || loading) return;
      setError("");
      setLoading(true);
      try {
        const activeSessionId = sessionId || (await ensureSession());
        const data = await assistantPost<AssistantApiResponse>("/order-lookup", {
          sessionId: activeSessionId,
          guestId,
          orderId: trimmed,
        });
        appendAssistantResponse(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Order lookup failed");
      } finally {
        setLoading(false);
      }
    },
    [ensureSession, guestId, loading, sessionId],
  );

  const refreshSessions = useCallback(async () => {
    const activeGuestId = guestId || localStorage.getItem("assistant_guest_id") || "";
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeGuestId) params.set("guestId", activeGuestId);
      const data = await assistantGet<{ status: boolean; sessions: AssistantSessionSummary[] }>(
        `/sessions?${params.toString()}`,
      );
      setSessions(data.sessions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "History failed");
    } finally {
      setHistoryLoading(false);
    }
  }, [guestId]);

  const openHistory = useCallback(
    async (nextSessionId: string) => {
      const activeGuestId = guestId || localStorage.getItem("assistant_guest_id") || "";
      if (!nextSessionId) return;
      setHistoryLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ sessionId: nextSessionId });
        if (activeGuestId) params.set("guestId", activeGuestId);
        const data = await assistantGet<{
          status: boolean;
          messages: Array<AssistantMessage & { _id?: string; createdAt?: string }>;
        }>(`/history?${params.toString()}`);
        const mapped = (data.messages || [])
          .filter((message) => message.role === "user" || message.role === "assistant")
          .map((message, index) => ({
            id: String(message._id || `${message.role}_${index}`),
            role: message.role,
            content: message.content,
            intent: message.intent,
            cards: message.cards || [],
            suggestions: message.suggestions || [],
            createdAt: message.createdAt,
          }));
        setActiveSession(nextSessionId);
        setMessages(mapped.length ? mapped : [initialMessage]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "History failed");
      } finally {
        setHistoryLoading(false);
      }
    },
    [guestId, setActiveSession],
  );

  const startNewChat = useCallback(async () => {
    setError("");
    setHistoryLoading(true);
    try {
      const nextSessionId = await startNewSession();
      setActiveSession(nextSessionId);
      setMessages([initialMessage]);
      await refreshSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "New chat failed");
    } finally {
      setHistoryLoading(false);
    }
  }, [refreshSessions, setActiveSession, startNewSession]);

  return useMemo(
    () => ({
      messages,
      loading,
      historyLoading,
      error,
      sessions,
      sendMessage,
      lookupOrder,
      refreshSessions,
      openHistory,
      startNewChat,
      addAssistantNotice,
    }),
    [addAssistantNotice, error, historyLoading, loading, lookupOrder, messages, openHistory, refreshSessions, sendMessage, sessions, startNewChat],
  );
};
