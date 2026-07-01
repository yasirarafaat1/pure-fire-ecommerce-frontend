"use client";

import { useState, type FormEvent } from "react";
import type { OrderLookupAssistantCard } from "../types";

export default function OrderLookupCard({
  card,
  onLookup,
  disabled,
}: {
  card: OrderLookupAssistantCard;
  onLookup: (orderId: string) => void;
  disabled: boolean;
}) {
  const [orderId, setOrderId] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (orderId.trim()) onLookup(orderId);
  };

  return (
    <form onSubmit={submit} className="rounded-[5px] border border-black/10 bg-white p-3">
      <div className="text-sm font-bold">{card.title}</div>
      <p className="mt-1 text-xs text-[var(--muted)]">{card.message}</p>
      <div className="mt-3 flex gap-2">
        <input
          value={orderId}
          onChange={(event) => setOrderId(event.target.value)}
          className="input h-10 text-sm"
          placeholder={card.placeholder}
        />
        <button type="submit" disabled={disabled || !orderId.trim()} className="btn btn-primary h-10 px-3 text-xs">
          Track
        </button>
      </div>
    </form>
  );
}
