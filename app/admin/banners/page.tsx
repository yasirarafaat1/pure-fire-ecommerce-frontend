"use client";

import { useEffect, useState } from "react";

type Banner = {
  _id: string;
  title?: string;
  imageUrl: string;
  targetUrl: string;
  width?: number;
  height?: number;
  order?: number;
  isActive?: boolean;
};

const API = "/api/admin/banners";

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    imageUrl: "",
    imageFile: null as File | null,
    targetUrl: "",
    order: "0",
    isActive: true,
  });

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      const data = await res.json();
      setBanners(data.banners || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const onSubmit = async () => {
    const isUrl = (v: string) => /^https?:\/\/.+/i.test(v);
    if (!form.imageFile && !form.imageUrl) return alert("Upload an image or provide its URL");
    if (form.imageUrl && !isUrl(form.imageUrl)) return alert("Image URL must be a valid http/https URL");
    if (!form.targetUrl) return alert("Target URL is required");
    if (form.targetUrl && !isUrl(form.targetUrl)) return alert("Target URL must be a valid http/https URL");
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("targetUrl", form.targetUrl);
      fd.append("order", form.order);
      fd.append("isActive", String(form.isActive));
      if (form.imageUrl) fd.append("imageUrl", form.imageUrl);
      if (form.imageFile) fd.append("image", form.imageFile);

      const res = await fetch(API, { method: "POST", body: fd });
      if (!res.ok) {
        const d = await res.json();
        alert(d.message || "Save failed");
      } else {
        setForm({
          title: "",
          imageUrl: "",
          imageFile: null,
          targetUrl: "",
          order: "0",
          isActive: true,
        });
        fetchBanners();
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch(`${API}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    fetchBanners();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    await fetch(`${API}/${id}`, { method: "DELETE" });
    fetchBanners();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold mb-2">Banner Carousel</h1>
      <p className="text-sm text-[var(--muted)]">
        Upload 5-10 landscape banners. Recommended size: 1200×675 (16:9), black & white friendly. Provide a target URL—clicking the banner redirects users.
      </p>

      <div className="border border-black/15 rounded-[5px] p-4 grid gap-3 md:grid-cols-2 bg-white">
        <label className="text-sm text-center border border-black/15 rounded-[5px] p-3">
          Or Upload Image
          <input
            type="file"
            accept="image/*"
            className="mt-1"
            onChange={(e) => setForm({ ...form, imageFile: e.target.files?.[0] || null })}
          />
        </label>
        <label className="text-sm">
          Target URL (click redirects) *
          <input
            className="input mt-1"
            placeholder="https://..."
            value={form.targetUrl}
            onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Active
        </label>
        <button className="btn btn-primary mt-2" onClick={onSubmit} disabled={saving}>
          {saving ? "Saving..." : "Save banner"}
        </button>
      </div>

      <div className="border border-black/15 rounded-[5px] p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Existing banners</h2>
          {loading && <span className="text-xs text-[var(--muted)]">Loading…</span>}
        </div>
        {banners.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No banners yet.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {banners.map((b) => (
              <div key={b._id} className="border border-black/10 rounded-[5px] p-3 flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.imageUrl}
                  alt={b.title || "banner"}
                  className="w-28 h-16 object-cover rounded-[4px] border border-black/10"
                />
            <div className="flex-1 text-sm">
              {/* <div className="font-semibold">{b.title || "Untitled"}</div> */}
              <div className="text-[var(--muted)] break-words">{b.targetUrl}</div>
              <div className="mt-1 flex gap-2 text-xs">
                {/* <span>Order: {b.order ?? 0}</span> */}
                <span>
                  Size: {b.width || "?"}×{b.height || "?"}
                </span>
              </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      className="btn btn-ghost !py-1 !px-3"
                      onClick={() => toggleActive(b._id, !b.isActive)}
                    >
                      {b.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button className="btn btn-ghost !py-1 !px-3" onClick={() => remove(b._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
