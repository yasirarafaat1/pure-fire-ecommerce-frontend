export class AdminApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
  }
}

type AdminRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  redirectOnUnauthorized?: boolean;
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();
  if (!response.ok) {
    const message =
      response.status === 413
        ? "Upload is too large. Reduce image/video size and try again."
        : typeof payload === "object" && payload && "message" in payload
          ? String(payload.message)
          : `Request failed with status ${response.status}`;
    throw new AdminApiError(message, response.status);
  }
  return payload as T;
};

export const adminApi = {
  async request<T>(path: string, options: AdminRequestOptions = {}): Promise<T> {
    const headers = new Headers(options.headers);
    let body: BodyInit | undefined;
    if (options.body instanceof FormData) {
      body = options.body;
    } else if (options.body !== undefined) {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(options.body);
    }
    const response = await fetch(`/api/admin${path}`, {
      ...options,
      body,
      headers,
      credentials: "include",
      cache: options.cache || "no-store",
    });
    if (
      response.status === 401 &&
      options.redirectOnUnauthorized !== false &&
      typeof window !== "undefined"
    ) {
      const next = `${window.location.pathname}${window.location.search}`;
      window.location.assign(`/admin/login?redirect=${encodeURIComponent(next)}`);
    }
    return parseResponse<T>(response);
  },
  get<T>(path: string, options?: AdminRequestOptions) {
    return this.request<T>(path, { ...options, method: "GET" });
  },
  post<T>(path: string, body?: unknown, options?: AdminRequestOptions) {
    return this.request<T>(path, { ...options, method: "POST", body });
  },
  patch<T>(path: string, body?: unknown, options?: AdminRequestOptions) {
    return this.request<T>(path, { ...options, method: "PATCH", body });
  },
  put<T>(path: string, body?: unknown, options?: AdminRequestOptions) {
    return this.request<T>(path, { ...options, method: "PUT", body });
  },
  delete<T>(path: string, options?: AdminRequestOptions) {
    return this.request<T>(path, { ...options, method: "DELETE" });
  },
};
