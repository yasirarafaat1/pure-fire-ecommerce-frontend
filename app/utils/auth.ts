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
  const raw = (localStorage.getItem("user_email") || "").trim();
  const email = raw && raw !== "undefined" && raw !== "null" ? raw : "";
  if (email) return email;
  const sessionRaw = (sessionStorage.getItem("user_email") || "").trim();
  const sessionEmail =
    sessionRaw && sessionRaw !== "undefined" && sessionRaw !== "null" ? sessionRaw : "";
  if (sessionEmail) {
    localStorage.setItem("user_email", sessionEmail);
    return sessionEmail;
  }
  const cookieRaw = readCookie("user_email");
  const cookieEmail =
    cookieRaw && cookieRaw !== "undefined" && cookieRaw !== "null" ? cookieRaw : "";
  if (cookieEmail) {
    localStorage.setItem("user_email", cookieEmail);
    return cookieEmail;
  }
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
