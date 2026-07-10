"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { assistantGet, assistantPost } from "../assistant-api";
import { buildAssistantWelcomeMessage } from "../pageContext";
import type { AssistantApiResponse, AssistantCard, AssistantMessage, AssistantPageContext, AssistantSessionSummary } from "../types";

const pendingCheckoutKey = "assistant_pending_checkout";

type PendingCheckout = {
  product?: {
    product_id?: string | number;
    title?: string;
    qty?: number;
    quantity?: number;
    price?: number;
    mrp?: number;
    image?: string;
    color?: string;
    size?: string;
  };
  addressId?: string;
  productTitle?: string;
  createdAt?: number;
};

type SendMessageOptions = {
  replyTo?: AssistantMessage["replyTo"];
};

const readPendingCheckout = (): PendingCheckout | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(pendingCheckoutKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingCheckout;
    if (!parsed?.product?.product_id || !parsed.addressId) return null;
    if (parsed.createdAt && Date.now() - parsed.createdAt > 30 * 60 * 1000) {
      localStorage.removeItem(pendingCheckoutKey);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(pendingCheckoutKey);
    return null;
  }
};

const isConfirmCheckoutReply = (value: string) =>
  /^(yes|y|haan|ha|han|ji|ok|okay|confirm|haan ji|place order|pay now|payment|proceed|continue|order karo|order kar do)$/i.test(
    value.trim(),
  );
const isNoReply = (value: string) => /^(no|n|nahi|nahin|cancel|change|badlo)$/i.test(value.trim());
const isCreateAddressReply = (value: string) => /create\s+new\s+address|new\s+address|address\s+create/i.test(value);

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
    async (text: string, options: SendMessageOptions = {}) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      setError("");
      const activeReplyTo = options.replyTo ?? replyTo;
      const userMessage: AssistantMessage = {
        id: `user_${Date.now()}`,
        role: "user",
        content: trimmed,
        replyTo: activeReplyTo,
        createdAt: new Date().toISOString(),
      };
      setMessages((current) => [...current, userMessage]);
      if (!options.replyTo) setReplyTo(null);

      const pendingCheckout = readPendingCheckout();
      if (pendingCheckout && isConfirmCheckoutReply(trimmed)) {
        const pendingProductId = pendingCheckout.product?.product_id;
        if (!pendingProductId) {
          localStorage.removeItem(pendingCheckoutKey);
          addAssistantNotice("This checkout session expired. Please tap Buy Now again.", ["Buy now", "Find products"]);
          return;
        }

        addAssistantNotice(
          `Address confirmed for ${pendingCheckout.productTitle || "this product"}. Opening payment now.`,
          ["Payment help", "Shipping policy"],
        );
        window.dispatchEvent(
          new CustomEvent("assistant:confirm-checkout", {
            detail: {
              productId: pendingProductId,
              addressId: pendingCheckout.addressId,
            },
          }),
        );
        return;
      }

      if (pendingCheckout && isNoReply(trimmed)) {
        localStorage.removeItem(pendingCheckoutKey);
        addAssistantNotice("Okay, please select another address from the product card or create a new one.", [
          "Create new address",
          "Payment help",
        ]);
        return;
      }

      if (pendingCheckout && isCreateAddressReply(trimmed)) {
        localStorage.removeItem(pendingCheckoutKey);
        addAssistantNotice("Use the Create new option inside the product card to add a delivery address.", [
          "Payment help",
          "Shipping policy",
        ]);
        return;
      }

      setLoading(true);
      try {
        const activeSessionId = sessionId || (await ensureSession());
        const livePath =
          typeof window !== "undefined" ? window.location.pathname || pageContext.currentPath : pageContext.currentPath;
        const data = await assistantPost<AssistantApiResponse>("/message", {
          sessionId: activeSessionId,
          guestId,
          message: trimmed,
          context: {
            ...pageContext,
            currentPath: livePath || "/",
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
    [addAssistantNotice, ensureSession, guestId, loading, pageContext, replyTo, sessionId],
  );

  const getLauncherReply = useCallback((question: string) => {
    const normalized = question.toLowerCase();
    if (/\?|chahiye|chaiye|dikhau|dikhaun|kar du|karna hai|check|suggest|recommend|buy|cart|order|wishlist|profile|address|policy|help/.test(normalized)) {
      return "Yes";
    }
    return question;
  }, []);

  const sendLauncherQuestion = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || loading) return;
      const assistantQuestion: AssistantMessage = {
        id: `assistant_launcher_${Date.now()}`,
        role: "assistant",
        content: trimmed,
        suggestions: ["Yes", "No"],
        createdAt: new Date().toISOString(),
      };
      setMessages((current) => [...current, assistantQuestion]);
      await sendMessage(getLauncherReply(trimmed), {
        replyTo: {
          id: assistantQuestion.id,
          role: "assistant",
          content: trimmed,
        },
      });
    },
    [getLauncherReply, loading, sendMessage],
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
      sendLauncherQuestion,
      lookupOrder,
      refreshSessions,
      openHistory,
      startNewChat,
      addAssistantNotice,
      replyTo,
      setReplyTo,
    }),
    [addAssistantNotice, error, historyLoading, loading, lookupOrder, messages, openHistory, refreshSessions, replyTo, sendLauncherQuestion, sendMessage, sessions, startNewChat],
  );
};
