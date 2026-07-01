"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import AssistantLauncher from "./AssistantLauncher";
import AssistantPanel from "./AssistantPanel";
import { useAssistantChat } from "./hooks/useAssistantChat";
import { useAssistantSession } from "./hooks/useAssistantSession";
import { getAssistantPageContext } from "./pageContext";
import type { AssistantCard, ProductAssistantCard } from "./types";

export default function AssistantWidget() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(true);
  const pageContext = useMemo(() => getAssistantPageContext(pathname), [pathname]);
  const session = useAssistantSession(open);
  const chat = useAssistantChat({
    sessionId: session.sessionId,
    guestId: session.guestId,
    ensureSession: session.start,
    startNewSession: session.startNew,
    setActiveSession: session.setActiveSession,
    pageContext,
  });
  const { addAssistantNotice } = chat;

  useEffect(() => {
    const addNotice = (event: Event) => {
      const detail = (event as CustomEvent<{ content?: string; suggestions?: string[]; cards?: AssistantCard[] }>).detail;
      if (!detail?.content) return;
      addAssistantNotice(detail.content, detail.suggestions || [], detail.cards || []);
    };

    const addFromAssistant = async (event: Event) => {
      const detail = (event as CustomEvent<ProductAssistantCard>).detail;
      if (!detail?.productId) return;
      const cartId =
        localStorage.getItem("cart_id") ||
        `cart_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem("cart_id", cartId);
      try {
        const response = await fetch("/api/user/add-to-cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cart_id: cartId,
            product_id: detail.productId,
            qty: 1,
            price: detail.price,
            mrp: detail.mrp || detail.price,
            title: detail.title,
            image: detail.image,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data?.status === false) {
          throw new Error(data?.message || "Could not add this product to cart.");
        }
        window.dispatchEvent(new Event("cart:updated"));
        window.dispatchEvent(
          new CustomEvent("assistant:add-to-cart-result", {
            detail: {
              productId: detail.productId,
              ok: true,
              message: "Added to cart. You can buy it now or keep shopping.",
            },
          }),
        );
        addAssistantNotice(`${detail.title} added to your cart. Want to buy it now?`, [
          "Buy now",
          "Find similar products",
          "View cart count",
        ]);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not add this product to cart.";
        window.dispatchEvent(
          new CustomEvent("assistant:add-to-cart-result", {
            detail: { productId: detail.productId, ok: false, message },
          }),
        );
        addAssistantNotice(message, ["Find products", "Best sellers"]);
      }
    };

    window.addEventListener("assistant:notice", addNotice as EventListener);
    window.addEventListener("assistant:add-to-cart", addFromAssistant as EventListener);
    return () => {
      window.removeEventListener("assistant:notice", addNotice as EventListener);
      window.removeEventListener("assistant:add-to-cart", addFromAssistant as EventListener);
    };
  }, [addAssistantNotice]);

  return (
    <>
      <AssistantPanel
        open={open}
        messages={chat.messages}
        loading={chat.loading || session.loading}
        error={chat.error}
        onClose={() => setOpen(false)}
        onSend={chat.sendMessage}
        onLookup={chat.lookupOrder}
        sessions={chat.sessions}
        historyLoading={chat.historyLoading}
        onRefreshHistory={chat.refreshSessions}
        onOpenHistory={chat.openHistory}
        onStartNewChat={chat.startNewChat}
        replyTo={chat.replyTo}
        onReply={(message) =>
          chat.setReplyTo({
            id: message.id,
            role: message.role,
            content: message.content,
          })
        }
        onCancelReply={() => chat.setReplyTo(null)}
      />
      <AssistantLauncher open={open} onClick={() => setOpen((value) => !value)} />
    </>
  );
}
