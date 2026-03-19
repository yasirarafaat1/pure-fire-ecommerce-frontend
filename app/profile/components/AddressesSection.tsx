"use client";

import { useEffect, useState } from "react";
import AddressList from "./addresses/AddressList";
import AddressPanel from "./addresses/AddressPanel";
import { AddressItem, AddressPayload } from "./addresses/types";
import { getUserToken } from "../../utils/auth";

const API_BASE = "/api/user";
const getToken = () => getUserToken();

export default function AddressesSection({ email }: { email: string }) {
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"view" | "add" | "edit">("add");
  const [panelAddress, setPanelAddress] = useState<AddressItem | null>(null);
  const [error, setError] = useState("");

  const loadAddresses = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/get-user-addresess`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-token": getToken() },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.status) throw new Error(data.message || "Failed to load addresses");
      setAddresses(data.addresses || []);
    } catch (err: any) {
      setError(err.message || "Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!email) return;
    loadAddresses();
  }, [email]);

  const openForAdd = () => {
    setPanelMode("add");
    setPanelAddress(null);
    setPanelOpen(true);
  };

  const openForEdit = (addr: AddressItem) => {
    setPanelMode("edit");
    setPanelAddress(addr);
    setPanelOpen(true);
  };

  const openForView = (addr: AddressItem) => {
    setPanelMode("view");
    setPanelAddress(addr);
    setPanelOpen(true);
  };

  const saveAddress = async (payload: AddressPayload, id?: string | number | null) => {
    try {
      const res = await fetch(id ? `${API_BASE}/update-user-address` : `${API_BASE}/create-newAddress`, {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", "x-user-token": getToken() },
        body: JSON.stringify(id ? { ...payload, address_id: id } : payload),
      });
      const data = await res.json();
      if (!res.ok || !data.status) return { ok: false, message: data.message || "Failed to save address" };
      await loadAddresses();
      return { ok: true };
    } catch (err: any) {
      return { ok: false, message: err.message || "Failed to save address" };
    }
  };

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Saved Addresses</div>
        <button className="btn btn-ghost px-3 py-1 text-xs" onClick={openForAdd}>
          Add Address
        </button>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="border border-black/10 rounded-[8px] p-4 bg-white">
              <div className="h-3 w-1/3 bg-black/5 border border-black/10 rounded-[4px] animate-pulse" />
              <div className="mt-3 h-4 w-2/3 bg-black/5 border border-black/10 rounded-[4px] animate-pulse" />
              <div className="mt-2 h-3 w-1/2 bg-black/5 border border-black/10 rounded-[4px] animate-pulse" />
              <div className="mt-4 h-6 w-20 bg-black/5 border border-black/10 rounded-[6px] animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <AddressList items={addresses} onView={openForView} onEdit={openForEdit} />
        </>
      )}

      <AddressPanel
        open={panelOpen}
        mode={panelMode}
        address={panelAddress}
        email={email}
        onClose={() => setPanelOpen(false)}
        onSave={saveAddress}
      />
    </div>
  );
}
