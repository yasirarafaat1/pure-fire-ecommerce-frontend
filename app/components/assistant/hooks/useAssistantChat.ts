"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { assistantGet, assistantPost } from "../assistant-api";
import { buildAssistantWelcomeMessage } from "../pageContext";
import type { AssistantApiResponse, AssistantCard, AssistantMessage, AssistantPageContext, AssistantSessionSummary } from "../types";

export const useAssistantChat = ({
  sessionId,
  guestId,
  ensureSession,
  startNewSession,
  setActiveSession,
  pageContext,
}: {
  sessionId: string;
  guestId: string;
  ensureSession: () => Promise<string>;
  startNewSession: () => Promise<string>;
  setActiveSession: (sessionId: string) => void;
  pageContext: AssistantPageContext;
}) => {
  const welcomeMessage = useMemo(() => buildAssistantWelcomeMessage(pageContext), [pageContext]);
  const [messages, setMessages] = useState<AssistantMessage[]>([welcomeMessage]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState<AssistantSessionSummary[]>([]);
  const [replyTo, setReplyTo] = useState<AssistantMessage["replyTo"]>(null);

  const appendAssistantResponse = (
    data: AssistantApiResponse,
    fallbackReplyTo?: AssistantMessage["replyTo"],
  ) => {
    setMessages((current) => [
      ...current,
      {
        id: String(data.messageId || `assistant_${Date.now()}`),
        role: "assistant",
        content: data.message || "",
        intent: data.intent,
        cards: data.cards || [],
        suggestions: data.suggestions || [],
        replyTo: data.replyTo || fallbackReplyTo || null,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const addAssistantNotice = useCallback((content: string, suggestions: string[] = [], cards: AssistantCard[] = []) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    setMessages((current) => [
      ...current,
      {
        id: `assistant_notice_${Date.now()}`,
        role: "assistant",
        content: trimmed,
        cards,
        suggestions,
      },
    ]);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMessages((current) => {
        if (current.length === 1 && current[0]?.id?.startsWith("welcome_")) {
          return [welcomeMessage];
        }

        return current;
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [welcomeMessage]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      setError("");
      const userMessage: AssistantMessage = {
        id: `user_${Date.now()}`,
        role: "user",
        content: trimmed,
        replyTo,
        createdAt: new Date().toISOString(),
      };
      setMessages((current) => [...current, userMessage]);
      const activeReplyTo = replyTo;
      setReplyTo(null);
      setLoading(true);
      try {
        const activeSessionId = sessionId || (await ensureSession());
        const data = await assistantPost<AssistantApiResponse>("/message", {
          sessionId: activeSessionId,
          guestId,
          message: trimmed,
          context: {
            ...pageContext,
            currentPath: pageContext.currentPath || "/",
            cartId: localStorage.getItem("cart_id") || "",
            replyTo: activeReplyTo,
          },
        });
        appendAssistantResponse(data, {
          id: userMessage.id,
          role: "user",
          content: userMessage.content,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Assistant failed");
      } finally {
        setLoading(false);
      }
    },
    [ensureSession, guestId, loading, pageContext, replyTo, sessionId],
  );

  const lookupOrder = useCallback(
    async (orderId: string) => {
      const trimmed = orderId.trim();
      if (!trimmed || loading) return;
      setError("");
      const userMessage: AssistantMessage = {
        id: `user_${Date.now()}`,
        role: "user",
        content: `Track order ${trimmed}`,
        createdAt: new Date().toISOString(),
      };
      setMessages((current) => [...current, userMessage]);
      setLoading(true);
      try {
        const activeSessionId = sessionId || (await ensureSession());
        const data = await assistantPost<AssistantApiResponse>("/order-lookup", {
          sessionId: activeSessionId,
          guestId,
          orderId: trimmed,
          context: pageContext,
        });
        appendAssistantResponse(data, {
          id: userMessage.id,
          role: "user",
          content: userMessage.content,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Order lookup failed");
      } finally {
        setLoading(false);
      }
    },
    [ensureSession, guestId, loading, pageContext, sessionId],
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
            replyTo: message.replyTo || (message as { metadata?: { replyTo?: AssistantMessage["replyTo"] } }).metadata?.replyTo || null,
            createdAt: message.createdAt,
          }));
        setActiveSession(nextSessionId);
        setMessages(mapped.length ? mapped : [welcomeMessage]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "History failed");
      } finally {
        setHistoryLoading(false);
      }
    },
    [guestId, setActiveSession, welcomeMessage],
  );

  const startNewChat = useCallback(async () => {
    setError("");
    setHistoryLoading(true);
    try {
      const nextSessionId = await startNewSession();
      setActiveSession(nextSessionId);
      setMessages([welcomeMessage]);
      await refreshSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "New chat failed");
    } finally {
      setHistoryLoading(false);
    }
  }, [refreshSessions, setActiveSession, startNewSession, welcomeMessage]);

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
      replyTo,
      setReplyTo,
    }),
    [addAssistantNotice, error, historyLoading, loading, lookupOrder, messages, openHistory, refreshSessions, replyTo, sendMessage, sessions, startNewChat],
  );
};
