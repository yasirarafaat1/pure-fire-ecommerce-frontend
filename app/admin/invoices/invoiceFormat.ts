export const dash = (value: unknown) =>
  value === undefined || value === null || value === "" ? "-" : String(value);

export const formatInvoiceDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-IN");
};

export const formatInvoiceMoney = (value?: number | string | null, currency = "INR") => {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed)) return "-";
  return `${currency} ${parsed.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
