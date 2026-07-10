import Link from "next/link";
import { buildProductHref } from "../../utils/productUrl";
import type { CartItem } from "../cart-types";
import { getColorName } from "../cart-utils";
import CartSkeleton from "./CartSkeleton";

type Props = {
  open: boolean;
  items: CartItem[];
  loading: boolean;
  clearing: boolean;
  wishlistIds: Set<string>;
  totals: { subtotal: number; mrpTotal: number; promoDiscount?: number; payable?: number };
  promoCode: string;
  promoMessage: string;
  publicPromos: Array<{
    code: string;
    description?: string;
    discountType?: "PERCENTAGE" | "FIXED";
    discountValue?: number;
    minimumOrderAmount?: number;
  }>;
  appliedPromo: { code: string; discountAmount: number; description?: string } | null;
  promoLoading: boolean;
  onClose: () => void;
  onClear: () => void;
  onCheckout: () => void;
  onPromoCodeChange: (value: string) => void;
  onApplyPromo: () => void;
  onApplyPublicPromo: (code: string) => void;
  onRemovePromo: () => void;
  onRemove: (item: CartItem) => void;
  onToggleWishlist: (item: CartItem) => void;
  onUpdateQty: (item: CartItem, quantity: number) => void;
};

const formatMoney = (value: number) => `\u20b9${value.toLocaleString("en-IN")}`;

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

export default function CartDrawer({
  open,
  items,
  loading,
  clearing,
  wishlistIds,
  totals,
  promoCode,
  promoMessage,
  publicPromos,
  appliedPromo,
  promoLoading,
  onClose,
  onClear,
  onCheckout,
  onPromoCodeChange,
  onApplyPromo,
  onApplyPublicPromo,
  onRemovePromo,
  onRemove,
  onToggleWishlist,
  onUpdateQty,
}: Props) {
  return (
    <div className={`fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
      <button
        aria-label="Close cart"
        data-close-cursor="true"
        className={`absolute inset-0 bg-slate-950/35 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
        type="button"
      />
      <aside
        aria-label="Shopping cart panel"
        className={`absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl transition-transform duration-500 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {loading ? (
          <CartSkeleton />
        ) : (
          <>
            <header className="flex items-start justify-between gap-4 border-b border-black/10 p-5">
              <div>
                <h1 className="text-2xl font-semibold">Shopping Cart</h1>
                <p className="text-sm text-[var(--muted)]">Review your items before checkout.</p>
              </div>
              <button
                aria-label="Close cart"
                className="grid h-10 w-10 place-items-center rounded-full border border-black/15 text-black transition hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                onClick={onClose}
                type="button"
              >
                <CloseIcon />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-5">
              {!items.length ? (
                <div className="grid place-items-center gap-5 py-20 text-center text-sm text-[var(--muted)]">
                  <p>Your cart is empty.</p>
                  <Link href="/" className="btn btn-ghost">Continue shopping</Link>
                </div>
              ) : (
                <div className="grid gap-4">
                  {items.map((item) => (
                    <CartDrawerItem
                      item={item}
                      wishlisted={wishlistIds.has(String(item.id))}
                      key={`${item.id}-${item.color}-${item.size}`}
                      onRemove={onRemove}
                      onToggleWishlist={onToggleWishlist}
                      onUpdateQty={onUpdateQty}
                    />
                  ))}
                </div>
              )}
            </div>
            {items.length > 0 && (
              <footer className="grid gap-3 border-t border-black/10 bg-white p-5">
                <div className="flex items-center justify-between text-sm">
                  <span>MRP</span><span>{formatMoney(totals.mrpTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Discount</span>
                  <span className="text-green-700">- {formatMoney(totals.mrpTotal - totals.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Shipping</span><span className="text-[#1AC417]">Free</span>
                </div>
                <div className="grid gap-2 rounded-[5px] border border-black/10 bg-black/[0.02] p-3">
                  <div className="flex items-center gap-2">
                    <input
                      className="min-w-0 flex-1 rounded-[5px] border border-black/15 bg-white px-3 py-2 text-sm uppercase outline-none focus:border-black"
                      placeholder="Promo code"
                      value={promoCode}
                      onChange={(event) => onPromoCodeChange(event.target.value.toUpperCase())}
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
                  {publicPromos.length ? (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {publicPromos.slice(0, 6).map((promo) => (
                        <button
                          key={promo.code}
                          type="button"
                          className="min-w-[150px] rounded-[5px] border border-dashed border-black/25 bg-white px-3 py-2 text-left text-xs transition hover:border-black"
                          onClick={() => onApplyPublicPromo(promo.code)}
                        >
                          <span className="block font-black text-black">{promo.code}</span>
                          <span className="mt-1 line-clamp-2 block text-[11px] text-[var(--muted)]">
                            {promo.description ||
                              (promo.discountType === "PERCENTAGE"
                                ? `${promo.discountValue || 0}% off`
                                : `${formatMoney(Number(promo.discountValue || 0))} off`)}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {appliedPromo ? (
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-green-700">
                        {appliedPromo.code} applied: - {formatMoney(appliedPromo.discountAmount)}
                      </span>
                      <button className="font-semibold text-red-600" type="button" onClick={onRemovePromo}>
                        Remove
                      </button>
                    </div>
                  ) : null}
                  {promoMessage ? <p className="text-xs font-medium text-[var(--muted)]">{promoMessage}</p> : null}
                </div>
                {totals.promoDiscount ? (
                  <div className="flex items-center justify-between text-sm">
                    <span>Promo discount</span>
                    <span className="text-green-700">- {formatMoney(totals.promoDiscount)}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Total</span><span>{formatMoney(totals.payable ?? totals.subtotal)}</span>
                </div>
                <div className="flex gap-3">
                  <button className="btn btn-primary flex-1" onClick={onCheckout}>Proceed to Checkout</button>
                  <button className="btn btn-ghost px-3" onClick={onClear} disabled={clearing}>
                    {clearing ? "Clearing..." : "Clear"}
                  </button>
                </div>
              </footer>
            )}
          </>
        )}
      </aside>
    </div>
  );
}

function CartDrawerItem({
  item,
  wishlisted,
  onRemove,
  onToggleWishlist,
  onUpdateQty,
}: {
  item: CartItem;
  wishlisted: boolean;
  onRemove: (item: CartItem) => void;
  onToggleWishlist: (item: CartItem) => void;
  onUpdateQty: (item: CartItem, quantity: number) => void;
}) {
  return (
    <div className="flex gap-4 border-b border-black/15 pb-4">
      <a href={buildProductHref({ id: item.id, name: item.title, color: item.color, size: item.size })}>
        <img src={item.image} alt={item.title} className="h-32 w-24 rounded-[5px] object-cover" />
      </a>
      <div className="grid flex-1 gap-2 text-sm">
        <div><p className="font-semibold">{item.title}</p>{item.subcategory && <p className="text-[var(--muted)]">{item.subcategory}</p>}</div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{formatMoney(item.price)}</span>
          {item.mrp != null && <span className="text-xs text-[#999] line-through">{formatMoney(item.mrp)}</span>}
          {item.mrp && item.mrp > item.price && <span className="text-xs font-semibold text-green-700">{Math.round(((item.mrp - item.price) / item.mrp) * 100)}% off</span>}
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-[var(--muted)]">
          {item.color && <span>Color: {getColorName(item.color)}</span>}{item.size && <span>Size: {item.size}</span>}
        </div>
        <div className="inline-flex w-fit items-center overflow-hidden rounded-[5px] border border-black/20">
          <button className="px-3 py-1" onClick={() => onUpdateQty(item, Math.max(0, item.qty - 1))}>-</button>
          <span className="border-x border-black/20 px-3 py-1">{item.qty}</span>
          <button className="px-3 py-1" onClick={() => onUpdateQty(item, item.qty + 1)}>+</button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-[5px] border border-black/20 px-4 py-2 text-xs hover:bg-black/10" onClick={() => onRemove(item)}>Remove</button>
          <button className="rounded-[5px] border border-black/20 px-4 py-2 text-xs hover:bg-black/10" onClick={() => onToggleWishlist(item)}>
            {wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          </button>
        </div>
      </div>
    </div>
  );
}
