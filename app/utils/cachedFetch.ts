"use client";

type CacheEntry = {
  ts: number;
  data: any;
  status: number;
};

const memoryCache = new Map<string, CacheEntry>();
const DEFAULT_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string, options?: RequestInit) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: options?.signal || controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

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

const readLocal = (key: string): CacheEntry | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`cache:${key}`);
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

const writeLocal = (key: string, entry: CacheEntry) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
  } catch {
    // ignore storage errors
  }
};

export const getCachedJson = (
  url: string,
  options?: RequestInit,
  ttlMs: number = 600000,
  allowStale: boolean = true,
): CacheEntry | null => {
  const key = getKey(url, options);
  const now = Date.now();
  const memoryHit = memoryCache.get(key);
  const sessionHit = readSession(key);
  const localHit = readLocal(key);
  const hit = memoryHit || sessionHit || localHit;
  if (!hit) return null;
  if (allowStale) return hit;
  if (now - hit.ts < ttlMs) return hit;
  return null;
};

export async function cachedFetch(
  url: string,
  options?: RequestInit,
  ttlMs: number = 600000,
  allowStale: boolean = false,
): Promise<Response> {
  const method = (options?.method || "GET").toUpperCase();
  if (method !== "GET") return fetchWithTimeout(url, options);

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

  const localHit = readLocal(key);
  if (localHit && now - localHit.ts < ttlMs) {
    memoryCache.set(key, localHit);
    return new Response(JSON.stringify(localHit.data), {
      status: localHit.status,
      headers: { "content-type": "application/json" },
    });
  }

  const staleHit = memoryHit || sessionHit || localHit;
  if (staleHit && allowStale) {
    const startRevalidate = () => {
      fetchWithTimeout(url, options)
        .then(async (res) => {
          const contentType = res.headers.get("content-type") || "";
          if (!res.ok || !contentType.includes("application/json")) return;
          const data = await res.json();
          const entry: CacheEntry = { ts: Date.now(), data, status: res.status };
          memoryCache.set(key, entry);
          writeSession(key, entry);
          writeLocal(key, entry);
        })
        .catch(() => {});
    };
    if (now - staleHit.ts >= ttlMs) startRevalidate();
    return new Response(JSON.stringify(staleHit.data), {
      status: staleHit.status,
      headers: { "content-type": "application/json" },
    });
  }

  const res = await fetchWithTimeout(url, options);
  const contentType = res.headers.get("content-type") || "";
  if (!res.ok || !contentType.includes("application/json")) return res;

  const data = await res.json();
  const entry: CacheEntry = { ts: now, data, status: res.status };
  memoryCache.set(key, entry);
  writeSession(key, entry);
  writeLocal(key, entry);
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}
