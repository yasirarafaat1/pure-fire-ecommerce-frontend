"use client";

import { FormEvent, useState } from "react";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminPagination from "../components/AdminPagination";
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "../components/AdminStates";
import AdminStatusBadge from "../components/AdminStatusBadge";
import { useAdminList } from "../hooks/useAdminList";
import { AdminApiError, adminApi } from "../lib/adminApi";
import type { AdminRole } from "../types/admin";

type User = { _id: string; name: string; email: string; role: AdminRole; status: "ACTIVE" | "DISABLED"; lastLoginAt?: string };
const blank = { name: "", email: "", password: "", role: "MANAGER" as AdminRole };

export default function AdminUsersPage() {
  const list = useAdminList<User>("/users");
  const [form, setForm] = useState(blank);
  const [message, setMessage] = useState("");

  const create = async (event: FormEvent) => {
    event.preventDefault(); setMessage("");
    try { await adminApi.post("/users", form); setForm(blank); setMessage("Admin user created."); await list.refresh(); }
    catch (error) { setMessage(error instanceof AdminApiError ? error.message : "Create failed"); }
  };
  const update = async (user: User, patch: Partial<User>) => {
    try { await adminApi.patch(`/users/${user._id}`, patch); setMessage("Admin updated."); await list.refresh(); }
    catch (error) { setMessage(error instanceof AdminApiError ? error.message : "Update failed"); }
  };

  return (
    <div className="grid gap-6">
      <AdminPageHeader title="Admin users" description="SUPER_ADMIN-only role and account lifecycle management." />
      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <form className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={create}>
          <h3 className="font-semibold">Create administrator</h3>
          <div className="mt-4 grid gap-3">
            <Field label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
            <Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
            <Field label="Temporary password" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} />
            <label className="grid gap-1.5 text-sm font-medium">Role<select className="rounded-lg border border-slate-300 px-3 py-2" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as AdminRole })}>{["SUPER_ADMIN", "MANAGER", "SUPPORT", "CONTENT"].map((role) => <option key={role}>{role}</option>)}</select></label>
            <button className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white">Create admin</button>
            {message && <p className="text-sm text-slate-600">{message}</p>}
          </div>
        </form>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {list.loading ? <AdminLoadingState /> : list.error ? <AdminErrorState message={list.error} retry={list.refresh} /> : !list.items.length ? <AdminEmptyState title="No admin users" description="Create an administrator." /> : (
            <div className="divide-y divide-slate-100">{list.items.map((user) => <div className="grid gap-3 p-4 md:grid-cols-[1fr_180px_120px_auto]" key={user._id}><div><p className="font-medium">{user.name}</p><p className="text-sm text-slate-500">{user.email}</p></div><select className="rounded-lg border border-slate-300 px-2 py-2 text-sm" value={user.role} onChange={(event) => update(user, { role: event.target.value as AdminRole })}>{["SUPER_ADMIN", "MANAGER", "SUPPORT", "CONTENT"].map((role) => <option key={role}>{role}</option>)}</select><div className="self-center"><AdminStatusBadge status={user.status} /></div><button className="rounded-lg border border-slate-300 px-3 py-2 text-sm" onClick={() => update(user, { status: user.status === "ACTIVE" ? "DISABLED" : "ACTIVE" })}>{user.status === "ACTIVE" ? "Disable" : "Enable"}</button></div>)}</div>
          )}
          <AdminPagination pagination={list.pagination} onPage={list.setPage} onLimit={list.setLimit} />
        </div>
      </section>
    </div>
  );
}
function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}<input required type={type} className="rounded-lg border border-slate-300 px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
