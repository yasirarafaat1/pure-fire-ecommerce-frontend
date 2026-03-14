"use client";

import Link from "next/link";
import "../../globals.css";
import { useState } from "react";

const cards = [
  {
    title: "Create Categories",
    href: "/admin/add-category",
    subtitle: "Mens → Bottom Wears → Jeans",
  },
  {
    title: "Upload Products",
    href: "/admin/upload-product",
    subtitle: "Stepwise media + pricing",
  },
  {
    title: "Orders (coming soon)",
    href: "#",
    subtitle: "Track payments & stock",
  },
];

export default function DashboardPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleReset = async () => {
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
    } catch (err) {
      setResetMsg(err.message || "Reset failed");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 py-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
            Admin
          </p>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.title} href={card.href} className="card p-5 hover:shadow-xl">
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
        </div>
      </section>

      <section className="card p-6 max-w-xl">
        <h2 className="text-xl font-semibold mb-3">Reset admin password</h2>
        <p className="text-sm text-[var(--muted)] mb-4">Only accessible inside panel. Username is fixed to "admin".</p>
        <label className="grid gap-2 mb-3">
          <span className="label">Current password</span>
          <input
            className="input"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••"
          />
        </label>
        <label className="grid gap-2 mb-3">
          <span className="label">New password</span>
          <input
            className="input"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 chars"
          />
        </label>
        <div className="flex justify-end gap-2">
          <button
            className="btn btn-primary"
            onClick={handleReset}
            disabled={resetLoading || newPassword.length < 6 || !currentPassword}
          >
            {resetLoading ? "Updating…" : "Update password"}
          </button>
        </div>
        {resetMsg && <p className="mt-3 text-sm text-[var(--muted)]">{resetMsg}</p>}
      </section>
    </div>
  );
}
