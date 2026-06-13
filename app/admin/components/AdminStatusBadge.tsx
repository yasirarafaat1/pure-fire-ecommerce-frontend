const tone = (status: string) => {
  const value = status.toUpperCase();
  if (/ACTIVE|APPROVED|PAID|DELIVERED|PUBLISHED|SUCCESS/.test(value)) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  }
  if (/PENDING|PACKED|SHIPPED|DRAFT|WARNING/.test(value)) {
    return "bg-amber-50 text-amber-700 ring-amber-600/20";
  }
  if (/DISABLED|REJECTED|CANCELLED|FAILED|OUT/.test(value)) {
    return "bg-red-50 text-red-700 ring-red-600/20";
  }
  return "bg-slate-100 text-slate-700 ring-slate-500/20";
};

export default function AdminStatusBadge({ status }: { status?: string }) {
  const label = String(status || "UNKNOWN").replaceAll("_", " ");
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${tone(label)}`}>
      {label}
    </span>
  );
}
