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
  promo?: {
    code: string;
    discountAmount: number;
    message?: string;
  } | null;
  promoCode: string;
  promoMessage: string;
  promoLoading: boolean;
  onPromoCodeChange: (value: string) => void;
  onApplyPromo: () => void;
  onRemovePromo: () => void;
};

const toNum = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export default function OrderSummary({
  items,
  onPay,
  paying,
  disabled,
  promo,
  promoCode,
  promoMessage,
  promoLoading,
  onPromoCodeChange,
  onApplyPromo,
  onRemovePromo,
}: Props) {
  const subtotal = items.reduce((sum, i) => sum + toNum(i.price) * toNum(i.qty || i.quantity || 1), 0);
  const mrpTotal = items.reduce((sum, i) => sum + toNum(i.mrp || i.price) * toNum(i.qty || i.quantity || 1), 0);
  const savings = Math.max(mrpTotal - subtotal, 0);
  const promoDiscount = Number(promo?.discountAmount || 0);
  const payable = Math.max(subtotal - promoDiscount, 0);

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
        {promo ? (
          <div className="flex items-center justify-between text-green-700">
            <span>Promo {promo.code}</span>
            <span>- {"\u20B9"}{promoDiscount.toFixed(0)}</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between border-t border-black/10 pt-2 font-semibold">
          <span>Total</span>
          <span>{"\u20B9"}{payable.toFixed(0)}</span>
        </div>
      </div>
      <div className="grid gap-2 rounded-[5px] border border-black/10 bg-black/[0.02] p-3">
        <div className="flex items-center gap-2">
          <input
            className="min-w-0 flex-1 rounded-[5px] border border-black/15 bg-white px-3 py-2 text-sm uppercase outline-none focus:border-black"
            placeholder="Promo code"
            value={promoCode}
            onChange={(event) => onPromoCodeChange(event.target.value)}
          />
          <button
            type="button"
            className="rounded-[5px] bg-black px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            disabled={promoLoading}
            onClick={onApplyPromo}
          >
            {promoLoading ? "Checking" : "Apply"}
          </button>
        </div>
        {promo ? (
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-green-700">
              {promo.code} applied: - {"\u20B9"}{promoDiscount.toFixed(0)}
            </span>
            <button className="font-semibold text-red-600" type="button" onClick={onRemovePromo}>
              Remove
            </button>
          </div>
        ) : null}
        {promoMessage ? <p className="text-xs font-medium text-[var(--muted)]">{promoMessage}</p> : null}
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
