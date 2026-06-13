"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminApiError, adminApi } from "../lib/adminApi";
import type { AdminUser } from "../types/admin";

type LoginResponse = { status: true; admin: AdminUser };

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirect, setRedirect] = useState("/admin/dashboard");
  const router = useRouter();

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get("redirect");
    if (next?.startsWith("/admin")) setRedirect(next);
    adminApi
      .get<LoginResponse>("/auth/me", { redirectOnUnauthorized: false })
      .then(() => router.replace("/admin/dashboard"))
      .catch(() => undefined);
  }, [router]);

  const login = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password || loading) return;
    setLoading(true);
    setMessage("");
    try {
      await adminApi.post<LoginResponse>(
        "/auth/login",
        { email: email.trim(), password },
        { redirectOnUnauthorized: false }
      );
      router.replace(redirect.startsWith("/admin") ? redirect : "/admin/dashboard");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof AdminApiError ? error.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <form
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
        onSubmit={login}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          PureFire Internal
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Admin sign in</h1>
        <p className="mt-2 text-sm text-slate-500">
          Use your assigned administrator account.
        </p>

        <label className="mt-8 grid gap-2 text-sm font-medium text-slate-700">
          Email or username
          <input
            className="rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            type="text"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="mt-4 grid gap-2 text-sm font-medium text-slate-700">
          Password
          <input
            className="rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {message && (
          <div role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {message}
          </div>
        )}
        <button
          className="mt-6 w-full rounded-lg bg-slate-950 px-4 py-2.5 font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-60"
          type="submit"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
