export const readCookie = (name: string) => {
  if (typeof document === "undefined") return "";
  const parts = document.cookie.split("; ").filter(Boolean);
  for (const part of parts) {
    const [key, ...rest] = part.split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
};

export const writeCookie = (name: string, value: string, days = 15) => {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`;
};

const RESERVED_GUEST_EMAIL = "guest@purefire.local";

const normalizeStoredEmail = (value: string | null | undefined) => {
  const email = (value || "").trim();
  if (!email || email === "undefined" || email === "null") return "";
  if (email.toLowerCase() === RESERVED_GUEST_EMAIL) return "";
  return email;
};

export const getUserToken = () => {
  if (typeof localStorage === "undefined") return "";
  const raw = (localStorage.getItem("user_token") || "").trim();
  const token = raw && raw !== "undefined" && raw !== "null" ? raw : "";
  if (token) return token;
  const sessionRaw = (sessionStorage.getItem("user_token") || "").trim();
  const sessionToken =
    sessionRaw && sessionRaw !== "undefined" && sessionRaw !== "null" ? sessionRaw : "";
  if (sessionToken) {
    localStorage.setItem("user_token", sessionToken);
    return sessionToken;
  }
  const cookieRaw = readCookie("user_token");
  const cookieToken =
    cookieRaw && cookieRaw !== "undefined" && cookieRaw !== "null" ? cookieRaw : "";
  if (cookieToken) {
    localStorage.setItem("user_token", cookieToken);
    return cookieToken;
  }
  return "";
};

export const getUserEmail = () => {
  if (typeof localStorage === "undefined") return "";
  const email = normalizeStoredEmail(localStorage.getItem("user_email"));
  if (email) return email;
  localStorage.removeItem("user_email");

  const sessionEmail = normalizeStoredEmail(sessionStorage.getItem("user_email"));
  if (sessionEmail) {
    localStorage.setItem("user_email", sessionEmail);
    return sessionEmail;
  }
  sessionStorage.removeItem("user_email");

  const cookieEmail = normalizeStoredEmail(readCookie("user_email"));
  if (cookieEmail) {
    localStorage.setItem("user_email", cookieEmail);
    return cookieEmail;
  }
  writeCookie("user_email", "", -1);
  return "";
};

export const setUserAuth = (token: string, email: string) => {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("user_token", token || "");
    localStorage.setItem("user_email", email || "");
  }
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem("user_token", token || "");
    sessionStorage.setItem("user_email", email || "");
  }
  writeCookie("user_token", token || "");
  writeCookie("user_email", email || "");
};

export const clearUserAuth = () => {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("user_token");
    localStorage.removeItem("user_email");
  }
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem("user_token");
    sessionStorage.removeItem("user_email");
  }
  writeCookie("user_token", "", -1);
  writeCookie("user_email", "", -1);
};

export const isAuthExpiredResponse = (status: number, message = "") => {
  const normalized = String(message || "").toLowerCase();
  return (
    status === 401 ||
    normalized.includes("session expired") ||
    normalized.includes("unauthorized") ||
    normalized.includes("auth error")
  );
};

export const logoutExpiredUser = (next = "/profile") => {
  clearUserAuth();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("wishlist:updated"));
    window.dispatchEvent(new Event("cart:updated"));
    window.dispatchEvent(new Event("auth:changed"));
    window.location.replace(`/login?next=${encodeURIComponent(next)}`);
  }
};

export const handleAuthExpiredResponse = (
  response: Response,
  data?: { message?: string },
  next = "/profile",
) => {
  if (!isAuthExpiredResponse(response.status, data?.message || "")) return false;
  logoutExpiredUser(next);
  return true;
};
