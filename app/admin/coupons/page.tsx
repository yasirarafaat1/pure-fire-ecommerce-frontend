"use client";

import { FormEvent, useState } from "react";
import AdminConfirmDialog from "../components/AdminConfirmDialog";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminPagination from "../components/AdminPagination";
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "../components/AdminStates";
import AdminStatusBadge from "../components/AdminStatusBadge";
import { useAdminList } from "../hooks/useAdminList";
import { AdminApiError, adminApi } from "../lib/adminApi";

type Coupon = {
  _id: string; code: string; discountType: "PERCENTAGE" | "FIXED"; discountValue: number;
  minimumOrderAmount: number; usageLimit: number; usedCount: number; startsAt?: string; endsAt?: string;
  status: "ACTIVE" | "DISABLED";
};

const blank = { code: "", discountType: "PERCENTAGE", discountValue: "", minimumOrderAmount: "0", maxDiscountAmount: "0", usageLimit: "0", perCustomerLimit: "0", startsAt: "", endsAt: "", status: "ACTIVE" };

export default function CouponsPage() {
  const list = useAdminList<Coupon>("/coupons");
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState<Coupon | null>(null);
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setMessage("");
    const payload = { ...form, discountValue: Number(form.discountValue), minimumOrderAmount: Number(form.minimumOrderAmount), maxDiscountAmount: Number(form.maxDiscountAmount), usageLimit: Number(form.usageLimit), perCustomerLimit: Number(form.perCustomerLimit) };
    try {
      if (editing) await adminApi.patch(`/coupons/${editing._id}`, payload); else await adminApi.post("/coupons", payload);
      setEditing(null); setForm(blank); setMessage("Coupon saved."); await list.refresh();
    } catch (error) { setMessage(error instanceof AdminApiError ? error.message : "Coupon save failed"); }
  };

  const edit = (coupon: Coupon) => {
    setEditing(coupon);
    setForm({ ...blank, code: coupon.code, discountType: coupon.discountType, discountValue: String(coupon.discountValue), minimumOrderAmount: String(coupon.minimumOrderAmount || 0), usageLimit: String(coupon.usageLimit || 0), startsAt: coupon.startsAt?.slice(0, 10) || "", endsAt: coupon.endsAt?.slice(0, 10) || "", status: coupon.status });
  };

  const remove = async () => {
    if (!deleting) return;
    try { await adminApi.delete(`/coupons/${deleting._id}`); setDeleting(null); setMessage("Coupon deleted."); await list.refresh(); }
    catch (error) { setMessage(error instanceof AdminApiError ? error.message : "Delete failed"); }
  };

  return (
    <div className="grid gap-6">
      <AdminPageHeader title="Coupons" description="Create and control persisted discount definitions. Checkout application remains contract-dependent." />
      <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={submit}>
          <h3 className="font-semibold">{editing ? "Edit coupon" : "Create coupon"}</h3>
          <div className="mt-4 grid gap-3">
            <Field label="Code" value={form.code} onChange={(value) => setForm({ ...form, code: value.toUpperCase() })} />
            <label className="grid gap-1.5 text-sm font-medium">Discount type<select className="rounded-lg border border-slate-300 px-3 py-2" value={form.discountType} onChange={(event) => setForm({ ...form, discountType: event.target.value })}><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed</option></select></label>
            <Field label="Discount value" type="number" value={form.discountValue} onChange={(value) => setForm({ ...form, discountValue: value })} />
            <Field label="Minimum order" type="number" value={form.minimumOrderAmount} onChange={(value) => setForm({ ...form, minimumOrderAmount: value })} />
            <Field label="Usage limit (0 unlimited)" type="number" value={form.usageLimit} onChange={(value) => setForm({ ...form, usageLimit: value })} />
            <div className="grid grid-cols-2 gap-2"><Field label="Starts" type="date" value={form.startsAt} onChange={(value) => setForm({ ...form, startsAt: value })} /><Field label="Ends" type="date" value={form.endsAt} onChange={(value) => setForm({ ...form, endsAt: value })} /></div>
            <button className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white">Save coupon</button>
            {editing && <button type="button" className="rounded-lg border border-slate-300 px-4 py-2 text-sm" onClick={() => { setEditing(null); setForm(blank); }}>Cancel edit</button>}
            {message && <p className="text-sm text-slate-600">{message}</p>}
          </div>
        </form>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {list.loading ? <AdminLoadingState /> : list.error ? <AdminErrorState message={list.error} retry={list.refresh} /> : !list.items.length ? <AdminEmptyState title="No coupons" description="Create the first coupon definition." /> : (
            <div className="divide-y divide-slate-100">{list.items.map((coupon) => <div className="flex flex-wrap items-center gap-4 p-4" key={coupon._id}><div className="min-w-40 flex-1"><p className="font-mono font-semibold">{coupon.code}</p><p className="text-sm text-slate-500">{coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`} discount · used {coupon.usedCount}/{coupon.usageLimit || "∞"}</p></div><AdminStatusBadge status={coupon.status} /><button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm" onClick={() => edit(coupon)}>Edit</button><button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700" onClick={() => setDeleting(coupon)}>Delete</button></div>)}</div>
          )}
          <AdminPagination pagination={list.pagination} onPage={list.setPage} onLimit={list.setLimit} />
        </div>
      </section>
      <AdminConfirmDialog open={Boolean(deleting)} title="Delete coupon?" description="This removes the coupon definition from admin storage." confirmLabel="Delete coupon" onClose={() => setDeleting(null)} onConfirm={remove} />
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}<input required={label === "Code" || label === "Discount value"} min={type === "number" ? "0" : undefined} type={type} className="rounded-lg border border-slate-300 px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
