"use client";

type Props = {
  name?: string;
  phone1?: string;
  phone2?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  addressType?: string;
};

export default function DeliveryAddressBox({
  name,
  phone1,
  phone2,
  addressLine1,
  city,
  state,
  country,
  pinCode,
  addressType,
}: Props) {
  return (
    <div className="border-b border-t border-black/15 p-5 grid gap-2">
      <div className="text-sm font-semibold">Delivery address</div>
      <div className="text-sm">
        {name || ""}
        {phone1 ? `, ${phone1}` : ""}
        {phone2 ? `, ${phone2}` : ""}
      </div>
      <div className="text-sm text-[var(--muted)]">
        {addressLine1}
        {city ? `, ${city}` : ""}
        {state ? `, ${state}` : ""}
        {country ? `, ${country}` : ""}
        {pinCode ? ` - ${pinCode}` : ""}
      </div>
      {addressType && <div className="text-xs text-[var(--muted)]">{addressType}</div>}
    </div>
  );
}
