"use client";

import { FiEdit } from "react-icons/fi";

type Address = {
  id?: string | number;
  address_id?: number | string;
  FullName?: string;
  phone1?: string;
  phone2?: string;
  email?: string;
  country?: string;
  state?: string;
  city?: string;
  district?: string;
  pinCode?: string;
  address?: string;
  address_line2?: string;
  addressType?: string;
};

type Props = {
  addresses: Address[];
  selectedId: string | number | null;
  onSelect: (id: string | number) => void;
  onEdit?: (id: string | number) => void;
};

export default function AddressList({ addresses, selectedId, onSelect, onEdit }: Props) {
  if (!addresses.length) {
    return (
      <div className="border border-black/20 rounded-[5px] p-4 text-sm text-[var(--muted)]">
        No saved addresses. Please add one in your profile.
      </div>
    );
  }

  return (
    <div className="grid gap-3 max-h-[420px] overflow-y-auto pr-1">
      {addresses.map((addr) => {
        const id = addr.address_id ?? addr.id ?? "";
        const active = String(id) === String(selectedId);
        return (
          <div
            key={String(id)}
            role="button"
            tabIndex={0}
            className={`text-left border-b border-t p-4 cursor-pointer ${
              active ? "border-black bg-black/5" : "border-black/20"
            }`}
            onClick={() => onSelect(id)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSelect(id);
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold text-sm">{addr.FullName || "Name"}</div>
              <div className="flex items-center gap-2">
                {addr.addressType && (
                  <span className="text-xs border border-black/30 rounded px-2 py-1">
                    {addr.addressType}
                  </span>
                )}
                {onEdit && (
                  <button
                    type="button"
                    className="btn btn-ghost !p-1"
                    aria-label="Edit address"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(id);
                    }}
                  >
                    <FiEdit />
                  </button>
                )}
              </div>
            </div>
            <div className="text-xs text-[var(--muted)] mt-1">
              {(addr.address || "").trim()} {addr.address_line2 || addr.district || ""}
            </div>
            <div className="text-xs text-[var(--muted)] mt-1">
              {addr.city || ""} {addr.state || ""} {addr.pinCode || ""} {addr.country || ""}
            </div>
            <div className="text-xs text-black mt-1">{addr.phone1 || ""}</div>
          </div>
        );
      })}
    </div>
  );
}
