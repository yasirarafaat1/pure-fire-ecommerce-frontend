"use client";

import { FormEvent, useState } from "react";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminPagination from "../components/AdminPagination";
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "../components/AdminStates";
import AdminStatusBadge from "../components/AdminStatusBadge";
import { useAdminList } from "../hooks/useAdminList";
import { AdminApiError, adminApi } from "../lib/adminApi";

type Notification = { _id: string; title: string; message: string; type: string; target: string; status: string; createdAt: string };
const blank = { title: "", message: "", type: "INFO", target: "ADMIN", status: "ACTIVE" };

export default function NotificationsPage() {
  const list = useAdminList<Notification>("/notifications");
  const [form, setForm] = useState(blank);
  const [message, setMessage] = useState("");
  const create = async (event: FormEvent) => {
    event.preventDefault();
    try { await adminApi.post("/notifications", form); setForm(blank); setMessage("Notification created."); await list.refresh(); }
    catch (error) { setMessage(error instanceof AdminApiError ? error.message : "Create failed"); }
  };
  const archive = async (item: Notification) => {
    await adminApi.patch(`/notifications/${item._id}`, { ...item, status: "ARCHIVED" }); await list.refresh();
  };
  return (
    <div className="grid gap-6">
      <AdminPageHeader title="Notifications" description="Internal persisted operational notices. No external delivery is triggered." />
      <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_2fr_auto_auto]" onSubmit={create}>
        <input required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        <input required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Message" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />
        <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>{["INFO", "SUCCESS", "WARNING", "ERROR"].map((type) => <option key={type}>{type}</option>)}</select>
        <button className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white">Create</button>
      </form>
      {message && <p className="text-sm text-slate-600">{message}</p>}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {list.loading ? <AdminLoadingState /> : list.error ? <AdminErrorState message={list.error} retry={list.refresh} /> : !list.items.length ? <AdminEmptyState title="No notifications" description="Create an internal notification." /> : <div className="divide-y divide-slate-100">{list.items.map((item) => <div className="flex flex-wrap items-center gap-4 p-4" key={item._id}><div className="min-w-56 flex-1"><p className="font-medium">{item.title}</p><p className="text-sm text-slate-500">{item.message}</p></div><AdminStatusBadge status={item.type} /><AdminStatusBadge status={item.status} />{item.status === "ACTIVE" && <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm" onClick={() => archive(item)}>Archive</button>}</div>)}</div>}
        <AdminPagination pagination={list.pagination} onPage={list.setPage} onLimit={list.setLimit} />
      </section>
    </div>
  );
}
