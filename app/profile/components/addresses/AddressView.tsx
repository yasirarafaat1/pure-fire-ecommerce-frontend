"use client";

import { AddressItem } from "./types";

export default function AddressView({ address, email }: { address: AddressItem; email: string }) {
  return (
    <div className="grid gap-3 text-sm">
      <div>
        <div className="text-xs text-[var(--muted)]">Name</div>
        <div className="font-semibold">{address.FullName}</div>
      </div>
      <div>
        <div className="text-xs text-[var(--muted)]">Phone</div>
        <div>{address.phone1}</div>
      </div>
      {address.phone2 && (
        <div>
          <div className="text-xs text-[var(--muted)]">Alt Phone</div>
          <div>{address.phone2}</div>
        </div>
      )}
      <div>
        <div className="text-xs text-[var(--muted)]">Email</div>
        <div>{address.email || email}</div>
      </div>
      <div>
        <div className="text-xs text-[var(--muted)]">Address</div>
        <div>
          {address.address}
          {address.district ? `, ${address.district}` : ""}, {address.city}, {address.state} {address.pinCode}
        </div>
      </div>
      <div>
        <div className="text-xs text-[var(--muted)]">Type</div>
        <div>{address.addressType || "Address"}</div>
      </div>
    </div>
  );
}
