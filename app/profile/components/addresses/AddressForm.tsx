"use client";

import { useState } from "react";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
import { AddressItem, AddressPayload } from "./types";
import {
  addressTypeOptions,
  countryOptions,
  isPhoneValid,
  normalizePhone,
  splitAddress,
  stateOptions,
} from "./addressUtils";

const SelectField = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <label className="label">{label}</label>
      <button
        type="button"
        className="input flex items-center justify-between cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={value ? "text-black" : "text-[var(--muted)]"}>{value || "Select"}</span>
        <span className="text-[var(--muted)]">{open ? <IoChevronUp /> : <IoChevronDown />}</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-black/15 rounded-[5px] max-h-52 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-black/5"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function AddressForm({
  email,
  address,
  onSave,
  onCancel,
}: {
  email: string;
  address: AddressItem | null;
  onSave: (payload: AddressPayload, id?: string | number | null) => Promise<{ ok: boolean; message?: string }>;
  onCancel: () => void;
}) {
  const split = splitAddress(address?.address || "");
  const [form, setForm] = useState({
    FullName: address?.FullName || "",
    phone1: address?.phone1 || "",
    phone2: address?.phone2 || "",
    email: address?.email || email,
    building: split.building,
    street: split.street,
    city: address?.city || "",
    district: address?.district || "",
    state: address?.state || "",
    country: address?.country || "India",
    pinCode: address?.pinCode || "",
    addressType: address?.addressType || "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

  const validate = () => {
    if (!form.FullName.trim()) return "Name required";
    if (!form.phone1.trim()) return "Phone required";
    if (!isPhoneValid(form.phone1)) return "Valid phone required";
    if (form.phone2.trim() && !isPhoneValid(form.phone2)) return "Valid alt phone required";
    if (form.phone2.trim()) {
      const primary = normalizePhone(form.phone1);
      const alt = normalizePhone(form.phone2);
      if (primary && alt && primary === alt) return "Primary and alt phone must be different";
    }
    if (!form.email.trim()) return "Email required";
    if (!form.building.trim()) return "Building required";
    if (!form.street.trim()) return "Street required";
    if (!form.city.trim()) return "City/Town required";
    if (!form.district.trim()) return "District required";
    if (!form.state.trim()) return "State required";
    if (!form.country.trim()) return "Country required";
    if (!/^\d{6}$/.test(form.pinCode.trim())) return "Valid 6-digit pin code required";
    if (!form.addressType.trim()) return "Address type required";
    return "";
  };

  const lookupPin = async (pin: string) => {
    if (!/^\d{6}$/.test(pin)) return;
    setPinLoading(true);
    try {
      const res = await fetch(`/api/user/pincode/${pin}`);
      const data = await res.json();
      if (!res.ok || !data.status) return;
      setForm((prev) => ({
        ...prev,
        district: data.district || prev.district,
        state: data.state || prev.state,
        country: data.country || prev.country,
      }));
    } finally {
      setPinLoading(false);
    }
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setSaving(true);
    setError("");
    const payload: AddressPayload = {
      FullName: form.FullName.trim(),
      phone1: form.phone1.trim(),
      phone2: form.phone2.trim(),
      email: form.email,
      address: [form.building, form.street].filter(Boolean).join(", "),
      address_line2: form.district.trim(),
      district: form.district.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      country: form.country.trim(),
      pinCode: form.pinCode.trim(),
      addressType: form.addressType.trim(),
    };
    const resp = await onSave(payload, address?.address_id);
    setSaving(false);
    if (!resp.ok) {
      setError(resp.message || "Failed to save address");
      return;
    }
    onCancel();
  };

  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="label">Full Name</label>
          <input className="input" value={form.FullName} onChange={(e) => setForm((p) => ({ ...p, FullName: e.target.value }))} />
        </div>
        <div>
          <label className="label">Email (read-only)</label>
          <input className="input" value={form.email} readOnly />
        </div>
        <div>
          <label className="label">Phone</label>
          <input
            className="input"
            value={form.phone1}
            onChange={(e) => setForm((p) => ({ ...p, phone1: e.target.value }))}
            onBlur={() => setForm((p) => ({ ...p, phone1: normalizePhone(p.phone1) }))}
          />
        </div>
        <div>
          <label className="label">Alt Phone (optional)</label>
          <input
            className="input"
            value={form.phone2}
            onChange={(e) => setForm((p) => ({ ...p, phone2: e.target.value }))}
            onBlur={() => setForm((p) => ({ ...p, phone2: normalizePhone(p.phone2) }))}
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="label">Building No.</label>
          <input className="input" value={form.building} onChange={(e) => setForm((p) => ({ ...p, building: e.target.value }))} />
        </div>
        <div>
          <label className="label">Street</label>
          <input className="input" value={form.street} onChange={(e) => setForm((p) => ({ ...p, street: e.target.value }))} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="label">City/Town</label>
          <input className="input" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
        </div>
        <div>
          <label className="label">District</label>
          <input className="input" value={form.district} onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))} />
        </div>
        <div>
          <label className="label">Pin Code</label>
          <input
            className="input"
            value={form.pinCode}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 6);
              setForm((p) => ({ ...p, pinCode: val }));
              if (val.length === 6) lookupPin(val);
            }}
          />
          {pinLoading && <div className="text-xs text-[var(--muted)] mt-1">Fetching location...</div>}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <SelectField label="State" value={form.state} options={stateOptions} onChange={(val) => setForm((p) => ({ ...p, state: val }))} />
        <SelectField label="Country" value={form.country} options={countryOptions} onChange={(val) => setForm((p) => ({ ...p, country: val }))} />
        <SelectField label="Address Type" value={form.addressType} options={addressTypeOptions} onChange={(val) => setForm((p) => ({ ...p, addressType: val }))} />
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="flex gap-2">
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? "Saving..." : address ? "Update Address" : "Save Address"}
        </button>
        <button className="btn btn-ghost" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
