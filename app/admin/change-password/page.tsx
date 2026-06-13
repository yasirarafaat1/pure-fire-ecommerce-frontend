"use client";

import { FormEvent, useState } from "react";
import { AdminApiError, adminApi } from "../lib/adminApi";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await adminApi.post<{ message: string }>("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setMessage(response.message);
      window.setTimeout(() => window.location.assign("/admin/login"), 800);
    } catch (error) {
      setMessage(error instanceof AdminApiError ? error.message : "Password update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Change password</h2>
      <p className="mt-1 text-sm text-slate-500">
        Updating your password revokes all existing admin sessions.
      </p>
      <form className="mt-6 grid gap-4" onSubmit={submit}>
        <label className="grid gap-2 text-sm font-medium">
          Current password
          <input
            className="rounded-lg border border-slate-300 px-3 py-2.5 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          New password
          <input
            className="rounded-lg border border-slate-300 px-3 py-2.5 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
        </label>
        <button
          className="rounded-lg bg-slate-950 px-4 py-2.5 font-medium text-white disabled:opacity-60"
          disabled={saving}
        >
          {saving ? "Updating..." : "Update password"}
        </button>
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </form>
    </section>
  );
}
