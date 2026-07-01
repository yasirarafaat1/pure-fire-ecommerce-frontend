import { getUserToken } from "../../utils/auth";
import type { AssistantApiResponse } from "./types";

const API_BASE = "/api/user/assistant";

const authHeaders = () => {
  const token = getUserToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { "x-user-token": token } : {}),
  };
};

export const assistantPost = async <T = AssistantApiResponse>(
  path: string,
  body: Record<string, unknown>,
) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as T & { status?: boolean; message?: string };
  if (!response.ok || data.status === false) {
    throw new Error(data.message || "Assistant request failed");
  }
  return data;
};

export const assistantGet = async <T>(path: string) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: authHeaders(),
    cache: "no-store",
  });
  const data = (await response.json()) as T & { status?: boolean; message?: string };
  if (!response.ok || data.status === false) {
    throw new Error(data.message || "Assistant request failed");
  }
  return data;
};
