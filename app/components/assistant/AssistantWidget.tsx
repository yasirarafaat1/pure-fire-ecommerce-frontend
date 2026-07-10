"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import AssistantLauncher from "./AssistantLauncher";
import AssistantPanel from "./AssistantPanel";
import { assistantPost } from "./assistant-api";
import { useAssistantChat } from "./hooks/useAssistantChat";
import { useAssistantSession } from "./hooks/useAssistantSession";
import { getAssistantPageContext } from "./pageContext";
import type { AssistantCard, ProductAssistantCard } from "./types";

const getLauncherQuestions = (pageContext: ReturnType<typeof getAssistantPageContext>) => {
  const productTitle = pageContext.productTitle || pageContext.title || "this product";

  if (pageContext.pageType === "product") {
    return [
      `Did you like ${productTitle}?`,
      `Ye product cart mein add kar du?`,
      "Iska size aur stock check karna hai?",
      "Similar products dikhau?",
      "Buy now karna hai?",
      "Is product ki quality kaisi hai?",
    ];
  }

  if (pageContext.pageType === "collection") {
    return [
      "Is collection se best pick chahiye?",
      "Budget ke hisaab se products dikhau?",
      "Best sellers dekhna hai?",
      "Under 1000 options chahiye?",
      "New arrivals explore karoge?",
    ];
  }

  if (pageContext.pageType === "wishlist") {
    return [
      "Wishlist se best item choose karu?",
      "Saved products ka count chahiye?",
      "Similar products dikhau?",
      "Wishlist mein kya buy karna hai?",
    ];
  }

  if (pageContext.pageType === "orders" || pageContext.pageType === "order_detail") {
    return [
      "Order status check karna hai?",
      "Delivery update chahiye?",
      "Latest order dikhau?",
      "Return ya support help chahiye?",
    ];
  }

  if (pageContext.pageType === "profile") {
    return [
      "Profile summary dikhau?",
      "Orders count chahiye?",
      "Cart aur wishlist count bataun?",
      "Saved addresses dekhna hai?",
    ];
  }

  if (pageContext.pageType === "policy") {
    return [
      "Is policy ko short mein samjhau?",
      "Return aur refund details chahiye?",
      "Shipping time check karna hai?",
      "Payment help chahiye?",
    ];
  }

  return [
    "Best sellers dekhna hai?",
    "Kis type ka product chahiye?",
    "New arrivals explore karoge?",
    "Order track karna hai?",
    "Budget ke hisaab se suggest karu?",
  ];
};

const shuffleQuestions = (items: string[]) => {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
};

export default function AssistantWidget() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [allowAutoOpen, setAllowAutoOpen] = useState(false);
  const pageContext = useMemo(() => getAssistantPageContext(pathname), [pathname]);
  const fallbackLauncherQuestions = useMemo(() => getLauncherQuestions(pageContext), [pageContext]);
  const [launcherQuestions, setLauncherQuestions] = useState<string[]>(fallbackLauncherQuestions);
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
    let mounted = true;
    const fallback = shuffleQuestions(fallbackLauncherQuestions);
    setLauncherQuestions(fallback);

    const loadLauncherQuestions = async () => {
      try {
        const data = await assistantPost<{ status: boolean; suggestions?: string[] }>(
          "/launcher-suggestions",
          {
            context: pageContext,
            fallback,
          },
        );
        if (!mounted) return;
        const suggestions = Array.isArray(data.suggestions)
          ? data.suggestions
              .map((item) => String(item || "").trim())
              .filter(Boolean)
          : [];
        setLauncherQuestions(suggestions.length ? shuffleQuestions(suggestions) : fallback);
      } catch {
        if (mounted) setLauncherQuestions(fallback);
      }
    };

    void loadLauncherQuestions();

    return () => {
      mounted = false;
    };
  }, [fallbackLauncherQuestions, pageContext]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => {
      setAllowAutoOpen(mq.matches);
      if (mq.matches) setOpen(true);
    };

    apply();

    if (mq.addEventListener) mq.addEventListener("change", apply);
    else mq.addListener(apply);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", apply);
      else mq.removeListener(apply);
    };
  }, []);

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

  const isProductPage = pageContext.pageType === "product";

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
      <AssistantLauncher
        open={open}
        onClick={() => setOpen(true)}
        onQuestionClick={(question) => {
          setOpen(true);
          void chat.sendLauncherQuestion(question);
        }}
        productPage={isProductPage}
        allowAutoOpen={allowAutoOpen}
        questions={launcherQuestions}
      />
    </>
  );
}
