"use client";

import ProductAssistantCard from "./ProductAssistantCard";
import type { WishlistAssistantCard } from "../types";

export default function WishlistCard({ card }: { card: WishlistAssistantCard }) {
  return (
    <div className="grid gap-2">
      <div className="rounded-[5px] border border-black/10 bg-white p-3 text-sm font-semibold">
        Wishlist items: {card.count}
      </div>
      {card.products.map((product) => (
        <ProductAssistantCard key={String(product.productId)} card={product} />
      ))}
    </div>
  );
}
