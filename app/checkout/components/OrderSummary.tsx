"use client";

type CartItem = {
  product_id?: number | string;
  title?: string;
  qty?: number;
  quantity?: number;
  price?: number;
  mrp?: number;
  image?: string;
  color?: string;
  size?: string;
};

type Props = {
  items: CartItem[];
  onPay: () => void;
  paying: boolean;
  disabled?: boolean;
};

const toNum = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export default function OrderSummary({ items, onPay, paying, disabled }: Props) {
  const subtotal = items.reduce((sum, i) => sum + toNum(i.price) * toNum(i.qty || i.quantity || 1), 0);
  const mrpTotal = items.reduce((sum, i) => sum + toNum(i.mrp || i.price) * toNum(i.qty || i.quantity || 1), 0);
  const savings = Math.max(mrpTotal - subtotal, 0);

  return (
    <div className="border-b border-t border-black/20 p-4 grid gap-3">
      <div className="text-sm font-semibold">Order Summary</div>
      <div className="grid gap-2 text-sm">
        <div className="flex items-center justify-between text-[var(--muted)]">
          <span>MRP</span>
          <span>{"\u20B9"}{mrpTotal.toFixed(0)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Discount</span>
          <span className="text-green-700">- ₹{(mrpTotal - subtotal).toLocaleString("en-IN")}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Subtotal</span>
          <span>{"\u20B9"}{subtotal.toFixed(0)}</span>
        </div>
      </div>
      <button
        type="button"
        className="btn btn-primary w-full"
        onClick={onPay}
        disabled={disabled || paying}
      >
        {paying ? "Processing..." : "Pay Now"}
      </button>
      <p className="text-[11px] text-[var(--muted)]">
        Secure payments powered by <b>Razorpay</b>
      </p>
    </div>
  );
}
