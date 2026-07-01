"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { assistantPost } from "../assistant-api";

const guestKey = "assistant_guest_id";
const sessionKey = "assistant_session_id";

const makeGuestId = () =>
  `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const readOrCreateGuestId = () => {
  const existing = localStorage.getItem(guestKey);
  if (existing) return existing;
  const next = makeGuestId();
  localStorage.setItem(guestKey, next);
  return next;
};

export const useAssistantSession = (enabled: boolean) => {
  const [sessionId, setSessionId] = useState("");
  const [guestId, setGuestId] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  const setActiveSession = useCallback((nextSessionId: string) => {
    if (!nextSessionId) return;
    localStorage.setItem(sessionKey, nextSessionId);
    setSessionId(nextSessionId);
  }, []);

  const start = useCallback(async (options?: { fresh?: boolean }) => {
    const nextGuestId = readOrCreateGuestId();
    const storedSessionId = options?.fresh ? "" : localStorage.getItem(sessionKey) || "";
    setGuestId(nextGuestId);
    setLoading(true);
    try {
      const data = await assistantPost<{
        status: boolean;
        sessionId: string;
        isAuthenticated: boolean;
      }>("/session", { guestId: nextGuestId, sessionId: storedSessionId });
      localStorage.setItem(sessionKey, data.sessionId);
      setSessionId(data.sessionId);
      setIsAuthenticated(Boolean(data.isAuthenticated));
      return data.sessionId;
    } finally {
      setLoading(false);
    }
  }, []);

  const startNew = useCallback(async () => {
    localStorage.removeItem(sessionKey);
    return start({ fresh: true });
  }, [start]);

  useEffect(() => {
    if (!enabled || sessionId) return;
    start().catch(() => undefined);
  }, [enabled, sessionId, start]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return undefined;

    const refreshAuthState = () => {
      start().catch(() => undefined);
    };

    window.addEventListener("auth:changed", refreshAuthState);
    return () => window.removeEventListener("auth:changed", refreshAuthState);
  }, [enabled, start]);

  return useMemo(
    () => ({ sessionId, guestId, isAuthenticated, loading, start, startNew, setActiveSession }),
    [guestId, isAuthenticated, loading, sessionId, start, startNew, setActiveSession],
  );
};
