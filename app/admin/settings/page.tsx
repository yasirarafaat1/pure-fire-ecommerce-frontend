"use client";

import { FormEvent, useEffect, useState } from "react";
import AdminPageHeader from "../components/AdminPageHeader";
import { AdminErrorState, AdminLoadingState } from "../components/AdminStates";
import { AdminApiError, adminApi } from "../lib/adminApi";

type Settings = {
  storeName: string; supportEmail: string; supportPhone: string; address: string; gstin?: string; gstNumber?: string; gstPercentage?: number | string | null;
  socialLinks: { instagram?: string; facebook?: string; youtube?: string; twitter?: string };
  seo: { title?: string; description?: string; logoUrl?: string; faviconUrl?: string };
  shipping: { defaultCourier?: string; freeShippingThreshold?: number };
};

const empty: Settings = { storeName: "", supportEmail: "", supportPhone: "", address: "", gstin: "", gstNumber: "", gstPercentage: "", socialLinks: {}, seo: {}, shipping: {} };

export default function SettingsPage() {
  const [form, setForm] = useState<Settings>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = () => { setLoading(true); adminApi.get<{ data: Settings }>("/settings").then((response) => setForm(response.data)).catch((requestError) => setError(requestError instanceof AdminApiError ? requestError.message : "Settings failed")).finally(() => setLoading(false)); };
  useEffect(() => {
    adminApi
      .get<{ data: Settings }>("/settings")
      .then((response) => setForm(response.data))
      .catch((requestError) =>
        setError(requestError instanceof AdminApiError ? requestError.message : "Settings failed")
      )
      .finally(() => setLoading(false));
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setMessage("");
    try { const response = await adminApi.put<{ data: Settings }>("/settings", form); setForm(response.data); setMessage("Store settings updated."); }
    catch (requestError) { setMessage(requestError instanceof AdminApiError ? requestError.message : "Update failed"); }
  };

  if (loading) return <AdminLoadingState label="Loading settings..." />;
  if (error) return <AdminErrorState message={error} retry={load} />;
  return (
    <div className="grid gap-6">
      <AdminPageHeader title="Store settings" description="Persisted identity, support, social, SEO, and shipping defaults." />
      <form className="grid gap-6" onSubmit={submit}>
        <SettingsCard title="Store identity">
          <Field label="Store name" value={form.storeName} onChange={(value) => setForm({ ...form, storeName: value })} />
          <Field label="Support email" type="email" value={form.supportEmail} onChange={(value) => setForm({ ...form, supportEmail: value })} />
          <Field label="Support phone" value={form.supportPhone} onChange={(value) => setForm({ ...form, supportPhone: value })} />
          <Field label="Address" value={form.address} onChange={(value) => setForm({ ...form, address: value })} />
          <Field label="GSTIN" value={form.gstin || form.gstNumber || ""} onChange={(value) => setForm({ ...form, gstin: value, gstNumber: value })} />
          <Field label="GST percentage" type="number" value={String(form.gstPercentage ?? "")} onChange={(value) => setForm({ ...form, gstPercentage: value })} />
        </SettingsCard>
        <SettingsCard title="Operations">
          {["instagram", "facebook", "youtube", "twitter"].map((network) => <Field key={network} label={`${network[0].toUpperCase()}${network.slice(1)} URL`} value={form.socialLinks?.[network as keyof Settings["socialLinks"]] || ""} onChange={(value) => setForm({ ...form, socialLinks: { ...form.socialLinks, [network]: value } })} />)}
        </SettingsCard>
        <div className="flex items-center gap-3"><button className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-medium text-white">Save settings</button>{message && <p className="text-sm text-slate-600">{message}</p>}</div>
      </form>
    </div>
  );
}

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-semibold">{title}</h3><div className="mt-4 grid gap-4 md:grid-cols-2">{children}</div></section>;
}
function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}<input min={type === "number" ? 0 : undefined} step={type === "number" ? "0.01" : undefined} required={label === "Store name"} type={type} className="rounded-lg border border-slate-300 px-3 py-2.5" value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
