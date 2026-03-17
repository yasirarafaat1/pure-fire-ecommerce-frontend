"use client";

import AddressForm from "./AddressForm";
import AddressView from "./AddressView";
import { AddressItem, AddressPayload } from "./types";

type PanelMode = "view" | "add" | "edit";

export default function AddressPanel({
  open,
  mode,
  address,
  email,
  onClose,
  onSave,
}: {
  open: boolean;
  mode: PanelMode;
  address: AddressItem | null;
  email: string;
  onClose: () => void;
  onSave: (payload: AddressPayload, id?: string | number | null) => Promise<{ ok: boolean; message?: string }>;
}) {
  if (!open) return null;

  const title = mode === "view" ? "Address Details" : address ? "Edit Address" : "Add Address";

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/30" onClick={onClose} aria-label="Close address panel" />
      <aside className="absolute right-0 top-0 h-full w-[95%] md:w-[60%] bg-white text-black border-l border-black/15 p-5 overflow-y-auto">
        <div className="flex items-center justify-between border-b border-black/10 pb-3 mb-4">
          <div className="text-sm font-semibold">{title}</div>
          <button className="btn btn-ghost px-3 py-1 text-xs" onClick={onClose}>
            Close
          </button>
        </div>

        {mode === "view" && address && <AddressView address={address} email={email} />}
        {mode !== "view" && (
          <AddressForm email={email} address={address} onSave={onSave} onCancel={onClose} />
        )}
      </aside>
    </div>
  );
}
