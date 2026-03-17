"use client";

import { useEffect, useMemo, useState } from "react";
import { FaShoppingCart } from "react-icons/fa";
import { FaStar, FaRegStar } from "react-icons/fa6";
import { FaTruckFast } from "react-icons/fa6";
import { MdOutlinePayments } from "react-icons/md";
import { returnPolicyText } from "../data/returnPolicy";

type Crumb = { label: string; href?: string };
type Highlight = { key: string; value: string };
type Color = { name: string; swatch: string };

type Props = {
  breadcrumbs: Crumb[];
  name: string;
  price: number;
  mrp: number;
  discount: string;
  rating: number;
  reviews: number;
  colors: Color[];
  selectedColor?: string | null;
  onSelectColor?: (color: string) => void;
  sizes: string[];
  selectedSize?: string | null;
  onSelectSize?: (size: string) => void;
  delivery: { pincode: string; eta: string };
  highlights: Highlight[];
  description: string;
  onAddToCart?: (payload: { color: string; size: string }) => void;
  onBuyNow?: (payload: { color: string; size: string }) => void;
  addedToCart?: boolean;
  onGoToCart?: () => void;
};

const Caret = ({ open }: { open: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    className={`text-[var(--muted)] transition-transform ${open ? "rotate-180" : "rotate-0"}`}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export default function InfoPanel({
  breadcrumbs,
  name,
  price,
  mrp,
  discount,
  rating,
  reviews,
  colors,
  selectedColor,
  onSelectColor,
  sizes,
  selectedSize: selectedSizeProp,
  onSelectSize,
  delivery,
  highlights,
  description,
  onAddToCart,
  onBuyNow,
  addedToCart,
  onGoToCart,
}: Props) {
  const [pin, setPin] = useState(delivery.pincode);
  const [pinError, setPinError] = useState<string | null>(null);
  const [eta, setEta] = useState<string>(delivery.eta);
  const [showHighlights, setShowHighlights] = useState(true);
  const [showDescription, setShowDescription] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const safeSizes = useMemo(
    () =>
      sizes
        .map((s: any) => (typeof s === "string" ? s : s?.label || s?.size || String(s)))
        .filter((s) => s && s !== "[object Object]"),
    [sizes],
  );
  const [localSize, setLocalSize] = useState<string | null>(safeSizes[0] || null);
  const selectedSize = selectedSizeProp ?? localSize;
  useEffect(() => {
    const next = safeSizes[0] || null;
    if (!next) return;
    if (selectedSize && safeSizes.includes(selectedSize)) return;
    if (selectedSize === next) return;
    if (selectedSizeProp !== undefined) onSelectSize?.(next);
    else setLocalSize(next);
  }, [safeSizes, selectedSize, selectedSizeProp, onSelectSize]);
  useEffect(() => {
    setSelectionError(null);
  }, [selectedColor, selectedSize]);
  const policyLines = returnPolicyText.split("\n").map((l) => l.trim()).filter(Boolean);
  const policyHeading = policyLines.shift() || "Returns, Exchange & Refund Policy";

  return (
    <section className="grid p-3 md:pl-10 gap-4">
      <nav className="hidden md:flex text-[12px] text-[var(--muted)] flex-wrap gap-1">
        {breadcrumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1">
            {c.href ? (
              <a href={c.href} className="underline-offset-2 hover:underline font-semibold text-black">
                {c.label}
              </a>
            ) : (
              <span className="font-semibold text-black">{c.label}</span>
            )}
            {i < breadcrumbs.length - 1 && <span className="text-black">/</span>}
          </span>
        ))}
      </nav>

      <div className="grid gap-2">
        <h1 className="text-[18px] md:text-[22px] leading-tight font-semibold text-[#585555]">{name}</h1>
        <div className="flex items-center gap-3 text-lg">
          <span className="text-2xl font-bold text-[#363636]">₹{price.toLocaleString("en-IN")}</span>
          <span className="text-xl text-[#888] font-medium">MRP</span>
          <span className="text-sm line-through text-[#999]">₹{mrp.toLocaleString("en-IN")}</span>
          <span className="px-3 py-2 text-sm font-extrabold text-[#2b1b00] bg-gradient-to-r from-[#fde68a] via-[#ffef99] to-[#fdd75b] rounded-[6px] border border-[#f7d35c]">
            {discount}
          </span>
        </div>
        <p className="text-md text-[#363636] mt-1 font-medium">Inclusive of all taxes</p>
      </div>

      <div className="hidden md:flex items-center gap-2 text-sm">
        <div className="flex items-center gap-1 text-[#f59e0b] text-xl">
          {Array.from({ length: 5 }).map((_, i) =>
            i < Math.round(rating) ? <FaStar key={i} /> : <FaRegStar key={i} />
          )}
        </div>
        <span className="text-base font-medium text-black">{rating.toFixed(1)} ( {reviews} )</span>
      </div>

      <div className="grid gap-2">
        <p className="text-lg font-semibold">
          Color:{" "}
          <span className="font-normal">
            {colors.find((c) => c.swatch === selectedColor)?.name || colors[0]?.name || ""}
          </span>
        </p>
        <div className="flex flex-wrap gap-3">
          {colors.map((c) => {
            const active = selectedColor ? selectedColor === c.swatch : false;
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => onSelectColor?.(c.swatch)}
                className={`w-9 h-9 p-4 bg-white cursor-pointer rounded-full border ${
                  active ? "border-1 border-black shadow-[0_0_0_2px_#fff]" : "border-black/30"
                } transition-transform`}
                style={{ background: c.swatch }}
                title={c.name}
              />
            );
          })}
        </div>
      </div>

      <div className="grid gap-2">
        <p className="text-sm font-medium">Size:</p>
        <div className="flex flex-wrap gap-2">
          {safeSizes.map((s, i) => {
            const active = selectedSize === s;
            return (
              <button
                key={`${s}-${i}`}
                type="button"
                onClick={() => {
                  if (selectedSizeProp !== undefined) onSelectSize?.(s);
                  else setLocalSize(s);
                }}
                className={`relative cursor-pointer px-4 py-3 mb-4 border rounded-[8px] text-sm transition-colors ${
                  active ? "bg-black text-white border-black" : "border-gray-400 hover:bg-black hover:text-white"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div className="hidden md:flex flex-wrap gap-4">
        <button
          className="flex-1 min-w-[200px] cursor-pointer bg-[#222] text-white font-extrabold uppercase tracking-wide py-3 rounded-[10px] border border-[#222] flex items-center justify-center gap-2 text-sm"
          onClick={() => {
            if (addedToCart) {
              onGoToCart?.();
              return;
            }
            if (!selectedColor || !selectedSize) {
              setSelectionError("Please select color and size.");
              return;
            }
            onAddToCart?.({ color: selectedColor, size: selectedSize });
          }}
        >
          <FaShoppingCart /> {addedToCart ? "Go to Cart" : "Add to Cart"}
        </button>
        <button
          className="flex-1 min-w-[200px] cursor-pointer text-black font-extrabold uppercase tracking-wide py-3 rounded-[10px] border border-gray-600 flex items-center justify-center text-sm"
          onClick={() => {
            if (!selectedColor || !selectedSize) {
              setSelectionError("Please select color and size.");
              return;
            }
            onBuyNow?.({ color: selectedColor, size: selectedSize });
          }}
        >
          Buy Now
        </button>
      </div>
      {selectionError && <p className="text-sm text-red-600">{selectionError}</p>}

      {/* Mobile sticky CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-black/10 px-4 py-3 shadow-md">
        <div className="flex gap-3">
          <button
            className="flex-1 min-w-[150px] cursor-pointer bg-[#222] text-white font-extrabold uppercase tracking-wide py-3 rounded-[10px] border border-[#222] flex items-center justify-center gap-2 text-sm"
            onClick={() => {
              if (addedToCart) {
                onGoToCart?.();
                return;
              }
              if (!selectedColor || !selectedSize) {
                setSelectionError("Please select color and size.");
                return;
              }
              onAddToCart?.({ color: selectedColor, size: selectedSize });
            }}
          >
            <FaShoppingCart /> {addedToCart ? "Go to Cart" : "Add to Cart"}
          </button>
          <button
            className="flex-1 min-w-[150px] cursor-pointer text-black font-extrabold uppercase tracking-wide py-3 rounded-[10px] border border-gray-600 flex items-center justify-center text-sm"
            onClick={() => {
              if (!selectedColor || !selectedSize) {
                setSelectionError("Please select color and size.");
                return;
              }
              onBuyNow?.({ color: selectedColor, size: selectedSize });
            }}
          >
            Buy Now
          </button>
        </div>
      </div>

      <div className="grid gap-3 p-2 bg-white">
        <h4 className="text-lg font-semibold">Check Delivery Date</h4>
        <div className="flex w-full overflow-hidden rounded-[8px] border border-black/40">
          <input
            className="flex-1 px-4 py-3 text-base outline-none"
            value={pin}
            onChange={(e) => {
              const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 6);
              setPin(onlyDigits);
              setPinError(null);
            }}
            placeholder="Enter pincode"
          />
          <button
            className="px-5 py-3 text-center cursor-pointer bg-black text-white font-semibold"
            onClick={() => {
              if (!/^\d{6}$/.test(pin)) {
                setPinError("Enter a valid 6-digit pincode.");
                return;
              }
              const days = (parseInt(pin[5], 10) % 4) + 2;
              const base = new Date();
              base.setDate(base.getDate() + days);
              const dd = base.getDate();
              const mm = base.getMonth() + 1;
              const yyyy = base.getFullYear();
              setEta(`${dd}-${mm}-${yyyy}`);
              setPinError(null);
            }}
          >
            Check
          </button>
        </div>
        {pinError && <p className="text-sm text-red-600">{pinError}</p>}
        <div className="text-base font-semibold flex items-center gap-2">
          <span>Delivery by</span>
          <span className="text-green-600">{eta}</span>
        </div>
        <div className="grid gap-3 text-base text-[#555]">
          <div className="flex items-center gap-2">
            <FaTruckFast className="text-xl" />
            <span>Free Shipping</span>
          </div>
          <div className="flex items-center gap-2">
            <MdOutlinePayments className="text-xl" />
            <span>Cash on delivery Available</span>
          </div>
        </div>
      </div>

      <div className="border-t border-black/10 pt-3">
        <button
          className="w-full flex items-center justify-between text-left"
          onClick={() => setShowHighlights(!showHighlights)}
        >
          <div>
            <h4 className="text-lg font-semibold">Key Highlights</h4>
            <p className="text-xs text-[var(--muted)]">Fabric, fit, wash care and more</p>
          </div>
          <Caret open={showHighlights} />
        </button>
        {showHighlights && (
          <div className="grid grid-cols-2 gap-6 mt-4">
            {highlights.map((h, i) => (
              <div key={i} className="border-b border-black/5 pb-4">
                <p className="text-sm uppercase font-semibold tracking-wide text-gray-500">{h.key}</p>
                <p className="text-base font-medium mt-1 text-black/70">{h.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-black/10 pt-3">
        <button
          className="w-full flex items-center justify-between text-left"
          onClick={() => setShowDescription(!showDescription)}
        >
          <div>
            <h4 className="text-lg font-semibold">Description</h4>
            <p className="text-xs text-[var(--muted)]">Product overview and details</p>
          </div>
          <Caret open={showDescription} />
        </button>
        {showDescription && (
          <div
            className="prose max-w-none mt-4 text-sm prose-ul:pl-4 prose-li:my-1 prose-li:marker:text-black"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}
      </div>

      <div className="border-t border-black/10 pt-3">
        <button
          className="w-full flex items-center justify-between text-left"
          onClick={() => setShowPolicy(!showPolicy)}
        >
          <div>
            <h4 className="text-lg font-semibold">{policyHeading}</h4>
            <p className="text-xs text-[var(--muted)]">Returns, exchange and refunds</p>
          </div>
          <Caret open={showPolicy} />
        </button>
        {showPolicy && (
          <ul className="mt-4 grid gap-2 text-sm list-disc list-inside text-black/80">
            {policyLines.map((line, idx) => (
              <li key={idx}>{line}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
