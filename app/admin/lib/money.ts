const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

const toNumber = (value: number | string | null | undefined) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatInr = (value: number | string | null | undefined) =>
  inrFormatter.format(toNumber(value));

export const formatInrFromPaise = (value: number | string | null | undefined) =>
  formatInr(toNumber(value) / 100);
