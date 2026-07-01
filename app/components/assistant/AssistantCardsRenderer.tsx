"use client";

import AddressCard from "./cards/AddressCard";
import CountSummaryCard from "./cards/CountSummaryCard";
import LoginOtpCard from "./cards/LoginOtpCard";
import LoginPromptCard from "./cards/LoginPromptCard";
import LogoutConfirmCard from "./cards/LogoutConfirmCard";
import OrderAssistantCard from "./cards/OrderAssistantCard";
import OrderLookupCard from "./cards/OrderLookupCard";
import PolicyCard from "./cards/PolicyCard";
import ProductAssistantCard from "./cards/ProductAssistantCard";
import ProfileCard from "./cards/ProfileCard";
import WishlistCard from "./cards/WishlistCard";
import type { AssistantCard } from "./types";

export default function AssistantCardsRenderer({
  cards,
  onLookup,
  loading,
}: {
  cards: AssistantCard[];
  onLookup: (orderId: string) => void;
  loading: boolean;
}) {
  if (!cards.length) return null;

  return (
    <div className="mt-2 grid gap-2">
      {cards.map((card, index) => {
        const key = `${card.type}_${index}`;
        if (card.type === "product") return <ProductAssistantCard key={key} card={card} />;
        if (card.type === "order") return <OrderAssistantCard key={key} card={card} />;
        if (card.type === "login_prompt") return <LoginPromptCard key={key} card={card} />;
        if (card.type === "login_otp") return <LoginOtpCard key={key} card={card} />;
        if (card.type === "logout_confirm") return <LogoutConfirmCard key={key} card={card} />;
        if (card.type === "count_summary") return <CountSummaryCard key={key} card={card} />;
        if (card.type === "order_lookup") return <OrderLookupCard key={key} card={card} onLookup={onLookup} disabled={loading} />;
        if (card.type === "profile") return <ProfileCard key={key} card={card} />;
        if (card.type === "wishlist") return <WishlistCard key={key} card={card} />;
        if (card.type === "address") return <AddressCard key={key} card={card} />;
        if (card.type === "policy") return <PolicyCard key={key} card={card} />;
        if (card.type === "support") {
          return <PolicyCard key={key} card={{ type: "policy", title: card.title, content: card.message, actions: card.actions }} />;
        }
        if (card.type === "text") {
          return <div key={key} className="rounded-[5px] border border-black/10 bg-white p-3 text-xs text-[var(--muted)]">{card.content}</div>;
        }
        return null;
      })}
    </div>
  );
}
