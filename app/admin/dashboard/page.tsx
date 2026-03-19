"use client";

import Link from "next/link";
import "../../globals.css";
import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

const cards = [
  {
    title: "Create Categories",
    href: "/admin/add-category",
    subtitle: "Mens > Bottom Wears > Jeans",
  },
  {
    title: "Upload Products",
    href: "/admin/upload-product",
    subtitle: "Stepwise media + pricing",
  },
  {
    title: "Orders",
    href: "/admin/orders",
    subtitle: "Track payments & stock",
  },
];

export default function DashboardPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleReset = async () => {
    if (!currentPassword || newPassword.length < 6 || resetLoading) return;
    setResetLoading(true);
    setResetMsg("");
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "admin",
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.status) throw new Error(data.message || "Reset failed");
      setResetMsg("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setResetMsg(err.message || "Reset failed");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 py-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">Admin</p>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.title} href={card.href} className="card p-5">
            <p className="text-sm text-[var(--muted)]">{card.subtitle}</p>
            <h3 className="text-xl font-semibold mt-2">{card.title}</h3>
          </Link>
        ))}
      </section>

      <section className="card p-6">
        <h2 className="text-xl font-semibold mb-3">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link className="btn btn-primary" href="/admin/upload-product">
            Add product
          </Link>
          <Link className="btn btn-ghost" href="/admin/add-category">
            Manage categories
          </Link>
          <button className="btn btn-ghost" onClick={() => setShowReset(true)}>
            Reset admin password
          </button>
        </div>
      </section>

      {showReset && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowReset(false)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white border-l border-black/10 shadow-sm">
            <div className="h-full flex flex-col px-4">
              <div className="px-6 py-4 border-b border-black/10 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Reset password</h2>
                </div>
                <button
                  className="btn btn-ghost px-3 py-1"
                  onClick={() => setShowReset(false)}
                >
                  Close
                </button>
              </div>

              <div className="p-6 flex-1 overflow-auto">
                <p className="text-sm text-[var(--muted)] mb-4">
                  Username is fixed to "admin".
                </p>
                <label className="grid gap-2 mb-3">
                  <span className="label">Current password</span>
                  <div className="relative">
                    <input
                      className="input pr-10"
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleReset();
                        }
                      }}
                      placeholder="******"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-3 -translate-y-1/3 text-black/70"
                      onClick={() => setShowCurrent((v) => !v)}
                      aria-label={showCurrent ? "Hide password" : "Show password"}
                    >
                      {showCurrent ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </label>
                <label className="grid gap-2 mb-3">
                  <span className="label">New password</span>
                  <div className="relative">
                    <input
                      className="input pr-10"
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleReset();
                        }
                      }}
                      placeholder="At least 6 chars"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-3 -translate-y-1/2 text-black/70"
                      onClick={() => setShowNew((v) => !v)}
                      aria-label={showNew ? "Hide password" : "Show password"}
                    >
                      {showNew ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </label>
                <div className="flex justify-end gap-2">
                  <button
                    className="btn btn-primary"
                    onClick={handleReset}
                    disabled={resetLoading || newPassword.length < 6 || !currentPassword}
                  >
                    {resetLoading ? "Updating..." : "Update password"}
                  </button>
                </div>
                {resetMsg && <p className="mt-3 text-sm text-[var(--muted)]">{resetMsg}</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
