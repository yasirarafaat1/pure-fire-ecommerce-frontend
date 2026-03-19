"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getUserEmail, getUserToken } from "../../../utils/auth";
import { Order } from "./orderUtils";

const API_BASE = "/api/user";
const POLL_MS = 15000;

export default function useOrderDetail(orderId: string) {
  const router = useRouter();
  const pathname = usePathname();
  const [authReady, setAuthReady] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const activeEmail = useMemo(() => getUserEmail(), []);

  useEffect(() => {
    const next = pathname || `/orders/${orderId}`;
    const maxAttempts = 15;
    let attempts = 0;

    const tryAuth = () => {
      const token = getUserToken();
      if (!token) return false;
      setAuthReady(true);
      return true;
    };

    if (tryAuth()) return;

    const intervalId = window.setInterval(() => {
      attempts += 1;
      if (tryAuth()) {
        window.clearInterval(intervalId);
        return;
      }
      if (attempts >= maxAttempts) {
        window.clearInterval(intervalId);
        router.replace(`/login?next=${encodeURIComponent(next)}`);
      }
    }, 100);

    const handleAuth = () => {
      if (tryAuth()) {
        window.clearInterval(intervalId);
      }
    };

    window.addEventListener("auth:changed", handleAuth as EventListener);
    window.addEventListener("storage", handleAuth as EventListener);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("auth:changed", handleAuth as EventListener);
      window.removeEventListener("storage", handleAuth as EventListener);
    };
  }, [orderId, pathname, router]);

  const fetchOrder = useCallback(
    async (signal?: AbortSignal, silent = false) => {
      if (!orderId) {
        setLoading(false);
        setOrder(null);
        return;
      }
      if (!silent) {
        setLoading(true);
        setError("");
      }
      try {
        const res = await fetch(`${API_BASE}/get-orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-token": getUserToken(),
          },
          body: JSON.stringify({ email: activeEmail }),
          signal,
        });
        const data = await res.json();
        if (!res.ok || !data.status) throw new Error(data.message || "Failed to load order");
        const list: Order[] = Array.isArray(data.orders) ? data.orders : [];
        const match = list.find(
          (o) => String(o.order_id) === String(orderId) || String(o._id) === String(orderId),
        );
        setOrder(match || null);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        if (!silent) setError("Unable to load order details right now.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [orderId, activeEmail],
  );

  useEffect(() => {
    if (!authReady) return;
    let active = true;
    const controller = new AbortController();

    fetchOrder(controller.signal);

    const intervalId = window.setInterval(() => {
      if (!active) return;
      fetchOrder(undefined, true);
    }, POLL_MS);

    return () => {
      active = false;
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [authReady, fetchOrder]);

  return { authReady, order, setOrder, loading, error, refresh: fetchOrder };
}
