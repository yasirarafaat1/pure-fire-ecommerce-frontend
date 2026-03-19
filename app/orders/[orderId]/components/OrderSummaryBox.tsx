"use client";

type Props = {
  totalQty: number;
  totalPrice: number;
  orderAmount: number;
  formatMoney: (value: number) => string;
};

export default function OrderSummaryBox({ totalQty, totalPrice, orderAmount, formatMoney }: Props) {
  const displayTotal = totalPrice || orderAmount || 0;
  return (
    <div className="border-b border-t border-black/15 p-5 grid gap-2">
      <div className="text-sm font-semibold">Order summary</div>
      <div className="flex items-center justify-between text-sm">
        <span>Items</span>
        <span>{totalQty}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span>Subtotal</span>
        <span>{formatMoney(displayTotal)}</span>
      </div>
      <div className="flex items-center justify-between text-sm border-t border-black/10 pt-2">
        <span className="font-semibold">Total</span>
        <span className="font-semibold">{formatMoney(displayTotal)}</span>
      </div>
    </div>
  );
}
