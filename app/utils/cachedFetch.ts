"use client";

type CacheEntry = {
  ts: number;
  data: any;
  status: number;
};

const memoryCache = new Map<string, CacheEntry>();

const getKey = (url: string, options?: RequestInit) => {
  const method = (options?.method || "GET").toUpperCase();
  return `${method}:${url}`;
};

const readSession = (key: string): CacheEntry | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(`cache:${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (!parsed || typeof parsed.ts !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeSession = (key: string, entry: CacheEntry) => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(`cache:${key}`, JSON.stringify(entry));
  } catch {
    // ignore storage errors
  }
};

export async function cachedFetch(
  url: string,
  options?: RequestInit,
  ttlMs: number = 120000,
): Promise<Response> {
  const method = (options?.method || "GET").toUpperCase();
  if (method !== "GET") return fetch(url, options);

  const key = getKey(url, options);
  const now = Date.now();
  const memoryHit = memoryCache.get(key);
  if (memoryHit && now - memoryHit.ts < ttlMs) {
    return new Response(JSON.stringify(memoryHit.data), {
      status: memoryHit.status,
      headers: { "content-type": "application/json" },
    });
  }

  const sessionHit = readSession(key);
  if (sessionHit && now - sessionHit.ts < ttlMs) {
    memoryCache.set(key, sessionHit);
    return new Response(JSON.stringify(sessionHit.data), {
      status: sessionHit.status,
      headers: { "content-type": "application/json" },
    });
  }

  const res = await fetch(url, options);
  const contentType = res.headers.get("content-type") || "";
  if (!res.ok || !contentType.includes("application/json")) return res;

  const data = await res.json();
  const entry: CacheEntry = { ts: now, data, status: res.status };
  memoryCache.set(key, entry);
  writeSession(key, entry);
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}
