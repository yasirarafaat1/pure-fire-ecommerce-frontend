"use client";

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
};

export default function AddressList({ addresses, selectedId, onSelect }: Props) {
  if (!addresses.length) {
    return (
      <div className="border border-black/20 rounded-[5px] p-4 text-sm text-[var(--muted)]">
        No saved addresses. Please add one in your profile.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {addresses.map((addr) => {
        const id = addr.address_id ?? addr.id ?? "";
        const active = String(id) === String(selectedId);
        return (
          <button
            key={String(id)}
            type="button"
            className={`text-left border rounded-[5px] p-4 cursor-pointer ${
              active ? "border-black bg-black/5" : "border-black/20"
            }`}
            onClick={() => onSelect(id)}
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold text-sm">{addr.FullName || "Name"}</div>
              {addr.addressType && (
                <span className="text-xs border border-black/30 rounded px-2 py-0.5">
                  {addr.addressType}
                </span>
              )}
            </div>
            <div className="text-xs text-[var(--muted)] mt-1">
              {(addr.address || "").trim()} {addr.address_line2 || addr.district || ""}
            </div>
            <div className="text-xs text-[var(--muted)] mt-1">
              {addr.city || ""} {addr.state || ""} {addr.pinCode || ""} {addr.country || ""}
            </div>
            <div className="text-xs text-black mt-1">{addr.phone1 || ""}</div>
          </button>
        );
      })}
    </div>
  );
}
