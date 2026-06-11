/**
 * Admin Authentication Utilities
 * Manages admin token storage, retrieval, and validation
 */

const ADMIN_TOKEN_KEY = "admin_token";
const ADMIN_USERNAME_KEY = "admin_username";

/**
 * Store admin token and username after login
 */
export const setAdminAuth = (token: string, username: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  localStorage.setItem(ADMIN_USERNAME_KEY, username);
};

/**
 * Get stored admin token
 */
export const getAdminToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
};

/**
 * Get stored admin username
 */
export const getAdminUsername = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_USERNAME_KEY);
};

/**
 * Check if admin is authenticated
 */
export const isAdminAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(ADMIN_TOKEN_KEY);
};

/**
 * Clear admin authentication (logout)
 */
export const clearAdminAuth = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USERNAME_KEY);
};

/**
 * Make authenticated request to admin API
 */
export const fetchAdminAPI = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const token = getAdminToken();
  if (!token) {
    throw new Error("Admin not authenticated");
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAdminAuth();
    if (typeof window !== "undefined") {
      window.location.href = "/admin/login";
    }
  }

  return response;
};
