"use client";

import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import AdminPageHeader from "../components/AdminPageHeader";
import { AdminErrorState, AdminLoadingState } from "../components/AdminStates";
import { AdminApiError, adminApi } from "../lib/adminApi";
import { Store } from "lucide-react";

type Settings = {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  address: string;
  gstin?: string;
  gstNumber?: string;
  gstPercentage?: number | string | null;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    twitter?: string;
  };
  seo: {
    title?: string;
    description?: string;
    logoUrl?: string;
    faviconUrl?: string;
  };
  shipping: {
    defaultCourier?: string;
    freeShippingThreshold?: number;
  };
};

const empty: Settings = {
  storeName: "",
  supportEmail: "",
  supportPhone: "",
  address: "",
  gstin: "",
  gstNumber: "",
  gstPercentage: "",
  socialLinks: {},
  seo: {},
  shipping: {},
};

function normalizeSettings(settings?: Partial<Settings> | null): Settings {
  return {
    ...empty,
    ...(settings || {}),
    socialLinks: {
      ...(settings?.socialLinks || {}),
    },
    seo: {
      ...(settings?.seo || {}),
    },
    shipping: {
      ...(settings?.shipping || {}),
    },
  };
}

export default function SettingsPage() {
  const [form, setForm] = useState<Settings>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [logoFileName, setLogoFileName] = useState("");
  const [logoPreviewUrl, setLogoPreviewUrl] = useState("");
  const logoObjectUrlRef = useRef("");

  const currentLogoUrl = logoPreviewUrl || form.seo?.logoUrl || "";

  const clearLogoObjectUrl = () => {
    if (logoObjectUrlRef.current) {
      URL.revokeObjectURL(logoObjectUrlRef.current);
      logoObjectUrlRef.current = "";
    }
  };

  const load = () => {
    setLoading(true);
    setError("");

    adminApi
      .get<{ data: Settings }>("/settings")
      .then((response) => setForm(normalizeSettings(response.data)))
      .catch((requestError) =>
        setError(
          requestError instanceof AdminApiError
            ? requestError.message
            : "Settings failed",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();

    return () => {
      clearLogoObjectUrl();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogoFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    setMessage("");

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage("Logo image should be under 2MB.");
      event.target.value = "";
      return;
    }

    clearLogoObjectUrl();

    const nextUrl = URL.createObjectURL(file);
    logoObjectUrlRef.current = nextUrl;

    setLogoFileName(file.name);
    setLogoPreviewUrl(nextUrl);
  };

  const removeLogoPreview = () => {
    clearLogoObjectUrl();
    setLogoPreviewUrl("");
    setLogoFileName("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setSaving(true);

    try {
      // Important:
      // Logo file is frontend-preview only for now.
      // Backend upload is not connected, so we only save existing JSON settings.
      const response = await adminApi.put<{ data: Settings }>("/settings", form);

      setForm(normalizeSettings(response.data));
      setMessage(
        logoPreviewUrl
          ? "Store settings updated. Logo preview is temporary until upload backend is connected."
          : "Store settings updated.",
      );
    } catch (requestError) {
      setMessage(
        requestError instanceof AdminApiError
          ? requestError.message
          : "Update failed",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLoadingState label="Loading settings..." />;
  if (error) return <AdminErrorState message={error} retry={load} />;

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        title="Store settings"
        description="Persisted identity defaults."
      />

      <form className="grid gap-6" onSubmit={submit}>

        <SettingsCard
          title="Brand logo"
          description="Upload and preview your storefront logo. This is UI-only until backend upload is connected."
        >
          <div className="md:col-span-2 grid gap-4 lg:grid-cols-[260px_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-4">
                {currentLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentLogoUrl}
                    alt="Logo preview"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="grid gap-2 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-lg font-bold text-white">
                      {form.storeName?.[0]?.toUpperCase() || "S"}
                    </div>
                    <p className="text-xs font-medium text-slate-500">
                      Logo preview
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-3 grid gap-1 text-center">
                <p className="text-sm font-semibold text-slate-900">
                  {logoFileName || "Current logo"}
                </p>
              </div>
            </div>

            <div className="grid content-start gap-4">
              <label className="group cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-white p-5 transition hover:border-slate-950 hover:bg-slate-50">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="sr-only"
                  onChange={handleLogoFile}
                />

                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        Upload logo
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        PNG, JPG, WEBP or SVG. Recommended square or horizontal logo.
                      </p>
                    </div>

                    <span className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition group-hover:bg-black">
                      Choose file
                    </span>
                  </div>
                </div>
              </label>

              {logoPreviewUrl && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-medium text-amber-800">
                      Preview selected. This image will not be uploaded until
                      backend upload API is added.
                    </p>

                    <button
                      type="button"
                      onClick={removeLogoPreview}
                      className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                    >
                      Remove preview
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SettingsCard>

        <SettingsCard
          title="Store identity"
          description="Basic store information shown across the storefront and customer communications."
        >
          <Field
            label="Store name"
            value={form.storeName}
            placeholder="My Store"
            onChange={(value) => setForm({ ...form, storeName: value })}
          />

          <Field
            label="Support email"
            type="email"
            value={form.supportEmail}
            placeholder="storename@example.com"
            onChange={(value) => setForm({ ...form, supportEmail: value })}
          />

          <Field
            label="Support phone"
            value={form.supportPhone}
            placeholder="+91 1234 5678 90"
            onChange={(value) => setForm({ ...form, supportPhone: value })}
          />

          <Field
            label="Address"
            value={form.address}
            placeholder="123, Smart City, Country"
            onChange={(value) => setForm({ ...form, address: value })}
          />

          <Field
            label="GSTIN"
            value={form.gstin || form.gstNumber || ""}
            placeholder="27ABCDE1234F2Z5"
            onChange={(value) =>
              setForm({ ...form, gstin: value, gstNumber: value })
            }
          />

          <Field
            label="GST percentage"
            type="number"
            value={String(form.gstPercentage ?? "")}
            placeholder="18"
            onChange={(value) => setForm({ ...form, gstPercentage: value })}
          />
        </SettingsCard>

        <SettingsCard
          title="Operations"
          description="Social links and customer-facing channel defaults."
        >
          {["instagram", "facebook", "youtube", "twitter"].map((network) => (
            <Field
              key={network}
              label={`${network[0].toUpperCase()}${network.slice(1)} URL`}
              placeholder={`https://www.${network}.com/store-name`}
              value={
                form.socialLinks?.[
                network as keyof Settings["socialLinks"]
                ] || ""
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  socialLinks: {
                    ...form.socialLinks,
                    [network]: value,
                  },
                })
              }
            />
          ))}
        </SettingsCard>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save settings"}
          </button>

          {message && <p className="text-sm text-slate-600">{message}</p>}
        </div>
      </form>
    </div>
  );
}

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h3 className="font-semibold text-slate-950">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-800">
      {label}

      <input
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "0.01" : undefined}
        required={label === "Store name"}
        type={type}
        placeholder={placeholder}
        className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}