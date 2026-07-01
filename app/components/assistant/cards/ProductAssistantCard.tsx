"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CreditCard, Minus, Plus, ShoppingCart } from "lucide-react";
import { getUserEmail, getUserToken, setUserAuth } from "../../../utils/auth";
import type { AssistantCard, ProductAssistantCard as ProductCardType } from "../types";

const money = (value?: number) => `Rs ${Number(value || 0).toLocaleString("en-IN")}`;

type AddressPayload = {
  id?: string | number;
  address_id?: string | number;
  FullName: string;
  phone1: string;
  phone2?: string;
  country: string;
  state: string;
  city: string;
  district?: string;
  pinCode: string;
  address: string;
  address_line2?: string;
  addressType: string;
};

type SavedAddress = AddressPayload & {
  email?: string;
};

type ApiResponse = {
  status?: boolean;
  message?: string;
  token?: string;
  email?: string;
  address?: SavedAddress;
  addresses?: SavedAddress[];
  data?: SavedAddress | SavedAddress[];
  order?: { id?: string };
  key?: string;
  amount?: number;
  currency?: string;
  order_id?: string | number;
};

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key?: string;
  amount?: number;
  currency?: string;
  name: string;
  description: string;
  order_id?: string;
  prefill: { email: string };
  handler: (response: RazorpayResponse) => Promise<void>;
  modal: { ondismiss: () => void };
  theme: { color: string };
};

type RazorpayConstructor = new (options: RazorpayOptions) => { open: () => void };

const emptyAddress: AddressPayload = {
  FullName: "",
  phone1: "",
  phone2: "",
  country: "India",
  state: "",
  city: "",
  district: "",
  pinCode: "",
  address: "",
  address_line2: "",
  addressType: "Home",
};

const loadRazorpay = () =>
  new Promise<boolean>((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    const win = window as Window & { Razorpay?: RazorpayConstructor };
    if (win.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function ProductAssistantCard({ card }: { card: ProductCardType }) {
  const [cartStatus, setCartStatus] = useState("");
  const [buyOpen, setBuyOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [address, setAddress] = useState<AddressPayload>(emptyAddress);
  const [addressId, setAddressId] = useState<string | number | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [addressMode, setAddressMode] = useState<"saved" | "new">("new");
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [buyMessage, setBuyMessage] = useState("");
  const [buyError, setBuyError] = useState("");
  const stock = Number(card.stock || 0);
  const hasStock = stock > 0;
  const total = useMemo(() => Number(card.price || 0) * quantity, [card.price, quantity]);

  const sendBotNotice = (content: string, suggestions: string[] = [], cards: AssistantCard[] = []) => {
    window.dispatchEvent(new CustomEvent("assistant:notice", { detail: { content, suggestions, cards } }));
  };

  const selectSavedAddress = (row: SavedAddress, rowId: string | number) => {
    setAddressId(rowId);
    setAddressConfirmed(false);
    sendBotNotice(
      `Delivery address selected: ${[row.address, row.city, row.state, row.pinCode].filter(Boolean).join(", ")}. Please confirm Yes or No.`,
      ["Yes", "No", "Create new address"],
    );
  };

  useEffect(() => {
    if (buyOpen) setEmail(getUserEmail());
  }, [buyOpen]);

  const loadSavedAddresses = async () => {
    if (!getUserToken()) return;
    setAddressesLoading(true);
    try {
      const response = await fetch("/api/user/get-user-addresess", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-token": getUserToken(),
        },
        body: JSON.stringify({ email: getUserEmail() }),
      });
      const data = (await response.json()) as ApiResponse;
      const rows = Array.isArray(data.addresses)
        ? data.addresses
        : Array.isArray(data.data)
          ? data.data
          : [];
      setSavedAddresses(rows);
      const firstId = rows[0]?.address_id || rows[0]?.id || null;
      setAddressId(firstId);
      setAddressConfirmed(false);
      setAddressMode(firstId ? "saved" : "new");
    } catch {
      setSavedAddresses([]);
      setAddressMode("new");
    } finally {
      setAddressesLoading(false);
    }
  };

  useEffect(() => {
    if (!buyOpen || !getUserToken()) return;
    loadSavedAddresses();
  }, [buyOpen]);

  useEffect(() => {
    const onCartResult = (event: Event) => {
      const detail = (event as CustomEvent<{ productId?: string | number; ok?: boolean; message?: string }>).detail;
      if (String(detail?.productId) !== String(card.productId)) return;
      setCartStatus(detail.ok ? detail.message || "Added to cart. You can buy it anytime." : detail.message || "Could not add to cart.");
    };
    window.addEventListener("assistant:add-to-cart-result", onCartResult as EventListener);
    return () => window.removeEventListener("assistant:add-to-cart-result", onCartResult as EventListener);
  }, [card.productId]);

  const addToCart = () => {
    setCartStatus("Adding...");
    window.dispatchEvent(new CustomEvent("assistant:add-to-cart", { detail: card }));
  };

  const changeQuantity = (next: number) => {
    setQuantity(Math.max(1, Math.min(next, stock || 1)));
  };

  const sendOtp = async () => {
    const emailValue = email.trim().toLowerCase();
    setBuyError("");
    setBuyMessage("");
    if (!emailValue) {
      setBuyError("Email required.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/user/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue }),
      });
      const data = (await response.json()) as ApiResponse;
      if (!response.ok || data.status === false) throw new Error(data.message || "Failed to send OTP");
      setOtpSent(true);
      setBuyMessage("OTP sent. Verify it to continue.");
    } catch (error) {
      setBuyError(error instanceof Error ? error.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const emailValue = email.trim().toLowerCase();
    const otpValue = otp.trim();
    setBuyError("");
    setBuyMessage("");
    if (!emailValue || otpValue.length !== 4) {
      setBuyError("Enter valid email and 4-digit OTP.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/user/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue, otp: otpValue }),
      });
      const data = (await response.json()) as ApiResponse;
      if (!response.ok || data.status === false || !data.token) throw new Error(data.message || "OTP verification failed");
      setUserAuth(data.token, data.email || emailValue);
      window.dispatchEvent(new Event("auth:changed"));
      setBuyMessage("Login verified. Select delivery address.");
      await loadSavedAddresses();
    } catch (error) {
      setBuyError(error instanceof Error ? error.message : "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const validateAddress = () => {
    if (!address.FullName.trim()) return "Full name required.";
    if (!/^\d{10}$/.test(address.phone1.trim())) return "Enter valid 10-digit phone.";
    if (!address.address.trim()) return "Full address required.";
    if (!address.city.trim()) return "City required.";
    if (!address.state.trim()) return "State required.";
    if (!/^\d{6}$/.test(address.pinCode.trim())) return "Enter valid 6-digit pincode.";
    return "";
  };

  const saveAddress = async () => {
    const validationError = validateAddress();
    setBuyError("");
    setBuyMessage("");
    if (validationError) {
      setBuyError(validationError);
      return null;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/user/create-newAddress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-token": getUserToken(),
        },
        body: JSON.stringify({ ...address, email: getUserEmail() }),
      });
      const data = (await response.json()) as ApiResponse;
      if (!response.ok || data.status === false) throw new Error(data.message || "Failed to save address");
      const savedRow = data.address || (Array.isArray(data.data) ? data.data[0] : data.data);
      const savedId = savedRow?.address_id || savedRow?.id || null;
      setAddressId(savedId);
      setAddressConfirmed(false);
      await loadSavedAddresses();
      setAddressMode("saved");
      sendBotNotice("New delivery address saved. Please confirm it before placing the order.", ["Yes", "No"]);
      setBuyMessage("Address saved. Please confirm it.");
      return savedId;
    } catch (error) {
      setBuyError(error instanceof Error ? error.message : "Failed to save address");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const payNow = async () => {
    setBuyError("");
    setBuyMessage("");
    if (!hasStock) {
      setBuyError("This product is out of stock.");
      return;
    }
    if (quantity > stock) {
      setBuyError(`Only ${stock} item(s) are available.`);
      return;
    }
    if (!getUserToken()) {
      setBuyError("Please verify email OTP first.");
      return;
    }
    let selectedAddressId = addressId;
    if (addressMode === "new") {
      selectedAddressId = await saveAddress();
    }
    if (addressMode === "saved" && !selectedAddressId) {
      setBuyError("Please select a delivery address.");
      return;
    }
    if (!addressConfirmed) {
      setBuyError("Please confirm the selected address first.");
      return;
    }
    if (!selectedAddressId) return;
    setLoading(true);
    try {
      const orderResponse = await fetch("/api/user/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-token": getUserToken(),
        },
        body: JSON.stringify({
          items: [{ product_id: card.productId, quantity }],
          address_id: selectedAddressId,
          email: getUserEmail(),
        }),
      });
      const orderJson = (await orderResponse.json()) as ApiResponse;
      if (!orderResponse.ok || orderJson.status === false) throw new Error(orderJson.message || "Failed to create payment order");
      const ready = await loadRazorpay();
      if (!ready) throw new Error("Payment checkout failed to load");
      const win = window as Window & { Razorpay?: RazorpayConstructor };
      if (!win.Razorpay) throw new Error("Payment checkout unavailable");
      const checkout = new win.Razorpay({
        key: orderJson.key,
        amount: orderJson.amount,
        currency: orderJson.currency || "INR",
        name: "Pure Fire",
        description: card.title,
        order_id: orderJson.order?.id,
        prefill: { email: getUserEmail() },
        handler: async (response) => {
          const verifyResponse = await fetch("/api/user/payment-success", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const verifyJson = (await verifyResponse.json()) as ApiResponse;
          if (!verifyResponse.ok || verifyJson.status === false) {
            setBuyError(verifyJson.message || "Payment verification failed.");
            sendBotNotice("Payment verification failed. Your order was not confirmed.", ["Try again", "Support"]);
            setLoading(false);
            return;
          }
          setBuyMessage(`Order placed successfully. Order ID: #${verifyJson.order_id || ""}`);
          sendBotNotice(
            `Order placed successfully. You can open order #${verifyJson.order_id || ""} from this card.`,
            ["Track order", "My orders", "Find products"],
            [
              {
                type: "order",
                orderId: verifyJson.order_id || "",
                status: "confirmed",
                paymentStatus: "paid",
                total,
                itemCount: quantity,
                isLimited: false,
                actions: [{ label: "View Order", type: "link", href: `/orders/${verifyJson.order_id || ""}` }],
              },
            ],
          );
          setLoading(false);
        },
        modal: {
          ondismiss: () => {
            sendBotNotice("Payment was closed before completion. No confirmed order was created.", ["Place order", "Support"]);
            setLoading(false);
          },
        },
        theme: { color: "#000000" },
      });
      checkout.open();
    } catch (error) {
      setBuyError(error instanceof Error ? error.message : "Payment failed");
      setLoading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-[5px] border border-black/10 bg-white">
      <Link href={card.href} className="grid grid-cols-[86px_1fr] gap-3 p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={card.image || "/Shopping.svg"}
          alt={card.title}
          className="h-24 w-full rounded-[5px] object-cover object-top"
        />
        <div className="min-w-0">
          <div className="line-clamp-2 text-sm font-semibold text-slate-950">{card.title}</div>
          {card.category ? <div className="mt-1 text-xs text-[var(--muted)]">{card.category}</div> : null}
          <div className="mt-7 flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold">{money(card.price)}</span>
            {card.mrp && card.mrp > card.price ? <span className="text-xs text-slate-400 line-through">{money(card.mrp)}</span> : null}
          </div>
        </div>
      </Link>

      <div className="grid grid-cols-2 gap-2 border-t border-black/10 p-2">
        <button type="button" onClick={() => setBuyOpen((value) => !value)} disabled={!hasStock} className="btn btn-ghost px-2 py-2 text-xs">
          <CreditCard size={14} />
          Buy Now
        </button>
        <button type="button" onClick={addToCart} disabled={!hasStock} className="btn btn-primary px-2 py-2 text-xs">
          <ShoppingCart size={14} />
          Add to Cart
        </button>
      </div>

      {cartStatus ? <div className="border-t border-black/10 px-3 py-2 text-xs font-bold text-slate-600">{cartStatus}</div> : null}

      {buyOpen ? (
        <div className="grid gap-3 border-t border-black/10 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-black text-slate-700">Quantity</span>
            <div className="flex items-center rounded-[6px] border border-black/10 bg-white">
              <button type="button" onClick={() => changeQuantity(quantity - 1)} className="grid h-9 w-9 place-items-center">
                <Minus size={14} />
              </button>
              <input inputMode="numeric" value={quantity} onChange={(event) => changeQuantity(Number(event.target.value.replace(/\D/g, "")) || 1)} className="h-9 w-12 border-x border-black/10 bg-transparent text-center text-sm font-black outline-none" />
              <button type="button" onClick={() => changeQuantity(quantity + 1)} className="grid h-9 w-9 place-items-center">
                <Plus size={14} />
              </button>
            </div>
          </div>
          <div className="rounded-[6px] bg-white p-2 text-xs font-bold text-slate-700">
            Total: <span className="text-slate-950">{money(total)}</span>
          </div>

          {!getUserToken() ? (
            <div className="grid gap-2">
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email required for order" className="assistant-order-input" />
              {otpSent ? <input inputMode="numeric" maxLength={4} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="Enter OTP" className="assistant-order-input" /> : null}
              <button type="button" disabled={loading} onClick={otpSent ? verifyOtp : sendOtp} className="btn btn-primary py-2 text-xs">
                {loading ? "Please wait..." : otpSent ? "Verify OTP" : "Send OTP"}
              </button>
            </div>
          ) : (
            <div className="grid gap-2">
              {addressesLoading ? (
                <div className="rounded-[6px] border border-black/10 bg-white p-3 text-xs font-bold text-slate-500">
                  Loading saved addresses...
                </div>
              ) : null}

              {!addressesLoading && savedAddresses.length > 0 && addressMode === "saved" ? (
                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-700">Delivery address</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAddressMode("new");
                        setAddressId(null);
                        setAddressConfirmed(false);
                      }}
                      className="text-xs font-black text-slate-950 underline"
                    >
                      Create new
                    </button>
                  </div>
                  <div className="assistant-address-list grid max-h-64 gap-2 overflow-y-auto pr-1">
                    {savedAddresses.map((row, index) => {
                      const rowId = row.address_id || row.id || index;
                      const selected = String(addressId || "") === String(rowId);
                      return (
                        <button
                          key={String(rowId)}
                          type="button"
                          onClick={() => selectSavedAddress(row, rowId)}
                          className={`rounded-[6px] border p-2 text-left transition ${selected ? "border-slate-950 bg-white shadow-sm" : "border-black/10 bg-white/70 hover:bg-white"
                            }`}
                        >
                          <span className="block text-xs font-black text-slate-950">
                            {row.FullName || "Saved address"} {row.addressType ? `- ${row.addressType}` : ""}
                          </span>
                          <span className="mt-1 block text-[11px] font-semibold leading-4 text-slate-500">
                            {[row.address, row.city, row.state, row.pinCode].filter(Boolean).join(", ")}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {addressId ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAddressConfirmed(true);
                          sendBotNotice("Address confirmed. You can place the order now.", ["Place order"]);
                        }}
                        className="btn btn-primary py-2 text-xs"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddressConfirmed(false);
                          setAddressId(null);
                          sendBotNotice("Okay, please select another address or create a new one.", ["Create new address"]);
                        }}
                        className="btn btn-ghost py-2 text-xs"
                      >
                        No
                      </button>
                    </div>
                  ) : null}
                  <button type="button" disabled={loading || !addressId || !addressConfirmed} onClick={payNow} className="btn btn-primary py-2 text-xs">
                    {loading ? "Processing..." : "Place Order"}
                  </button>
                </div>
              ) : null}

              {!addressesLoading && (savedAddresses.length === 0 || addressMode === "new") ? (
                <div className="grid gap-2">
                  {savedAddresses.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        const firstId = savedAddresses[0]?.address_id || savedAddresses[0]?.id || null;
                        setAddressId(addressId || firstId);
                        setAddressConfirmed(false);
                        setAddressMode("saved");
                      }}
                      className="justify-self-start text-xs font-black text-slate-950 underline"
                    >
                      Use saved address
                    </button>
                  ) : (
                    <div className="rounded-[6px] border border-dashed border-black/15 bg-white px-3 py-2 text-xs font-bold text-slate-500">
                      No saved address found. Create one to place this order.
                    </div>
                  )}
                  <input value={address.FullName} onChange={(event) => setAddress((value) => ({ ...value, FullName: event.target.value }))} placeholder="Full name" className="assistant-order-input" />
                  <input value={address.phone1} onChange={(event) => setAddress((value) => ({ ...value, phone1: event.target.value.replace(/\D/g, "").slice(0, 10) }))} placeholder="Phone number" className="assistant-order-input" />
                  <input value={address.address} onChange={(event) => setAddress((value) => ({ ...value, address: event.target.value }))} placeholder="Full address" className="assistant-order-input" />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={address.city} onChange={(event) => setAddress((value) => ({ ...value, city: event.target.value }))} placeholder="City" className="assistant-order-input" />
                    <input value={address.state} onChange={(event) => setAddress((value) => ({ ...value, state: event.target.value }))} placeholder="State" className="assistant-order-input" />
                  </div>
                  <input value={address.pinCode} onChange={(event) => setAddress((value) => ({ ...value, pinCode: event.target.value.replace(/\D/g, "").slice(0, 6) }))} placeholder="Pincode" className="assistant-order-input" />
                  <button type="button" disabled={loading} onClick={payNow} className="btn btn-primary py-2 text-xs">
                    {loading ? "Processing..." : "Place Order"}
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {buyMessage ? <p className="text-xs font-bold text-emerald-700">{buyMessage}</p> : null}
          {buyError ? <p className="text-xs font-bold text-red-600">{buyError}</p> : null}
        </div>
      ) : null}

      <style jsx>{`
        .assistant-order-input {
          height: 40px;
          border-radius: 6px;
          border: 1px solid rgba(15, 23, 42, 0.1);
          background: #ffffff;
          padding: 0 12px;
          font-size: 13px;
          font-weight: 650;
          color: #0f172a;
          outline: none;
        }

        .assistant-order-input::placeholder {
          color: #94a3b8;
        }

        .assistant-address-list {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .assistant-address-list::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
      `}</style>
    </div>
  );
}
