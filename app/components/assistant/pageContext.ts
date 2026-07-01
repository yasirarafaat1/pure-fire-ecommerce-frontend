import type { AssistantMessage, AssistantPageContext } from "./types";

const titleFromSlug = (value = "") =>
  decodeURIComponent(value)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const getAssistantPageContext = (pathname = "/"): AssistantPageContext => {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0] || "home";

  if (first === "product") {
    const productId = segments[1] || "";
    const productTitle = titleFromSlug(segments[2] || "this product");
    return {
      pageType: "product",
      currentPath: pathname,
      productId,
      productTitle,
      title: productTitle,
      suggestions: ["Tell me about this product", "Similar products", "Buy now", "Is it in stock?"],
      welcome:
        productTitle && productTitle !== "This Product"
          ? `You are viewing ${productTitle}. I can help with product details, similar items, stock, or buying it here.`
          : "You are viewing a product. I can help with details, similar items, stock, or buying it here.",
    };
  }

  if (first === "collections") {
    const collectionTitle = titleFromSlug(segments[1] || "all products");
    return {
      pageType: "collection",
      currentPath: pathname,
      title: collectionTitle,
      collectionSlug: segments[1] || "all",
      suggestions: ["Suggest from this collection", "Best sellers", "New arrivals", "Under 1000"],
      welcome: `You are browsing ${collectionTitle}. I can suggest products from this page or filter by price, category, and style.`,
    };
  }

  if (first === "profile") {
    return {
      pageType: "profile",
      currentPath: pathname,
      title: "Profile",
      suggestions: ["My profile", "My orders count", "My addresses", "Logout"],
      welcome: "You are on your profile page. I can summarize your account, orders, wishlist, addresses, and cart.",
    };
  }

  if (first === "orders") {
    const orderId = segments[1] || "";
    return {
      pageType: orderId ? "order_detail" : "orders",
      currentPath: pathname,
      title: orderId ? `Order ${orderId}` : "Orders",
      orderId,
      suggestions: orderId ? ["Track this order", "Shipping policy", "Support"] : ["My orders", "Latest order", "Track order"],
      welcome: orderId
        ? "You are viewing an order. I can explain the status, payment, delivery, or help with support."
        : "You are on your orders page. I can show recent orders, latest order, or track an order ID.",
    };
  }

  if (first === "wishlist") {
    return {
      pageType: "wishlist",
      currentPath: pathname,
      title: "Wishlist",
      suggestions: ["Wishlist count", "Show wishlist", "Similar products", "Best sellers"],
      welcome: "You are on your wishlist. I can summarize saved products or suggest similar products.",
    };
  }

  if (first === "checkout") {
    return {
      pageType: "checkout",
      currentPath: pathname,
      title: "Checkout",
      suggestions: ["Cart count", "My addresses", "Payment help", "Shipping policy"],
      welcome: "You are at checkout. I can help with cart, address, payment, shipping, or order questions.",
    };
  }

  if (["shipping-info", "return-policy", "refund-policy", "return-exchange-policy", "terms-and-conditions", "privacy-policy", "faqs"].includes(first)) {
    const title = titleFromSlug(first);
    return {
      pageType: "policy",
      currentPath: pathname,
      title,
      suggestions: ["Explain this policy", "Return policy", "Shipping policy", "Payment help"],
      welcome: `You are reading ${title}. I can summarize this policy or answer shopping questions.`,
    };
  }

  if (first === "support" || first === "contact") {
    return {
      pageType: "support",
      currentPath: pathname,
      title: "Support",
      suggestions: ["Track order", "Return policy", "Payment help", "Contact support"],
      welcome: "You are on support. I can help with order tracking, returns, payment, or support options.",
    };
  }

  return {
    pageType: "home",
    currentPath: pathname,
    title: "Home",
    suggestions: ["Find products", "Best sellers", "New arrivals", "Track order"],
    welcome: "Hi, I can help you find products, track orders, and answer shopping questions.",
  };
};

export const buildAssistantWelcomeMessage = (pageContext: AssistantPageContext): AssistantMessage => ({
  id: `welcome_${pageContext.pageType}`,
  role: "assistant",
  content: pageContext.welcome,
  suggestions: pageContext.suggestions,
  cards: [],
});
