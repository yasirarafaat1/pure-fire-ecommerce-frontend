"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API_BASE = "/api/auth";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const search = useSearchParams();
  const redirect = search.get("redirect") || "/admin/dashboard";

  const login = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.status) throw new Error(data.message || "Invalid credentials");
      router.replace(redirect);
      router.refresh();
    } catch (err: any) {
      setMessage(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-white text-black">
      <div className="card w-full max-w-md p-8 space-y-6 shadow-lg">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">Admin</p>
          <h1 className="text-2xl font-semibold">Sign in</h1>
        </div>
        <label className="grid gap-2">
          <span className="label">Admin username</span>
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
          />
        </label>
        <label className="grid gap-2">
          <span className="label">Password</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>
        <div className="flex gap-2 justify-end">
          <button
            className="btn btn-primary"
            onClick={login}
            disabled={loading || !username || !password}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </div>
        {message && <p className="text-sm text-[var(--muted)]">{message}</p>}
      </div>
    </main>
  );
}

