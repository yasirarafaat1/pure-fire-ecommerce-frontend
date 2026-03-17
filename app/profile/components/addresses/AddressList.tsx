"use client";

import { FiEdit2, FiEye } from "react-icons/fi";
import { AddressItem } from "./types";

export default function AddressList({
  items,
  onView,
  onEdit,
}: {
  items: AddressItem[];
  onView: (addr: AddressItem) => void;
  onEdit: (addr: AddressItem) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="border border-black/10 rounded-[5px] p-6 text-sm text-[var(--muted)]">
        No addresses found.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((addr) => (
        <div key={addr.address_id} className="border border-black/15 rounded-[5px] p-4 grid gap-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">{addr.FullName}</div>
            <div className="flex gap-2">
              <button className="btn btn-ghost px-3 py-1 text-xs" onClick={() => onView(addr)}>
                <FiEye /> View
              </button>
              <button className="btn btn-ghost px-3 py-1 text-xs" onClick={() => onEdit(addr)}>
                <FiEdit2 /> Edit
              </button>
            </div>
          </div>
          <div className="text-xs text-[var(--muted)]">{addr.addressType || "Address"}</div>
          <div className="text-sm line-clamp-2">
            {addr.address}
            {addr.district ? `, ${addr.district}` : ""}, {addr.city}, {addr.state} {addr.pinCode}
          </div>
        </div>
      ))}
    </div>
  );
}
