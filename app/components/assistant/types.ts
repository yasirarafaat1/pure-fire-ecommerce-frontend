export type AssistantAction =
  | { label: string; type: "link"; href: string }
  | { label: string; type: "action"; action: "add_to_cart" | "buy_now"; payload: { productId: string | number } };

export type ProductAssistantCard = {
  type: "product";
  productId: string | number;
  title: string;
  image: string;
  price: number;
  mrp?: number;
  stock?: number;
  category?: string;
  href: string;
  badges?: string[];
  actions?: AssistantAction[];
};

export type OrderAssistantCard = {
  type: "order";
  orderId: string | number;
  invoiceNumber?: string;
  status: string;
  paymentStatus?: string;
  total?: number;
  placedAt?: string;
  trackingUrl?: string;
  eta?: string;
  itemsPreview?: { productId?: string | number; quantity?: number; price?: number }[];
  itemCount?: number;
  isLimited?: boolean;
  actions?: AssistantAction[];
};

export type ProfileAssistantCard = {
  type: "profile";
  name: string;
  emailMasked?: string;
  phoneMasked?: string;
  actions?: AssistantAction[];
};

export type WishlistAssistantCard = {
  type: "wishlist";
  count: number;
  products: ProductAssistantCard[];
};

export type AddressAssistantCard = {
  type: "address";
  title: string;
  maskedAddress: string;
  city?: string;
  state?: string;
  pincode?: string;
  isDefault?: boolean;
};

export type LoginPromptAssistantCard = {
  type: "login_prompt";
  title: string;
  message: string;
  action: { label: string; href: string };
};

export type LoginOtpAssistantCard = {
  type: "login_otp";
  title: string;
  message: string;
  emailPlaceholder: string;
  otpPlaceholder: string;
  sendLabel: string;
  verifyLabel: string;
  changeEmailLabel: string;
};

export type LogoutConfirmAssistantCard = {
  type: "logout_confirm";
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
};

export type CountSummaryAssistantCard = {
  type: "count_summary";
  title: string;
  counts: {
    cart?: number;
    wishlist?: number;
    orders?: number;
    addresses?: number;
  };
  actions?: AssistantAction[];
};

export type OrderLookupAssistantCard = {
  type: "order_lookup";
  title: string;
  message: string;
  placeholder: string;
};

export type PolicyAssistantCard = {
  type: "policy";
  title: string;
  content: string;
  actions?: AssistantAction[];
};

export type SupportAssistantCard = {
  type: "support";
  title: string;
  message: string;
  fields?: string[];
  actions?: AssistantAction[];
};

export type TextAssistantCard = {
  type: "text";
  content: string;
};

export type AssistantCard =
  | ProductAssistantCard
  | OrderAssistantCard
  | ProfileAssistantCard
  | WishlistAssistantCard
  | AddressAssistantCard
  | LoginPromptAssistantCard
  | LoginOtpAssistantCard
  | LogoutConfirmAssistantCard
  | CountSummaryAssistantCard
  | OrderLookupAssistantCard
  | PolicyAssistantCard
  | SupportAssistantCard
  | TextAssistantCard;

export type AssistantMessage = {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  intent?: string | null;
  cards?: AssistantCard[];
  suggestions?: string[];
  replyTo?: {
    id: string;
    role: "user" | "assistant" | "system" | "tool";
    content: string;
  } | null;
  createdAt?: string;
};

export type AssistantPageContext = {
  pageType:
    | "home"
    | "product"
    | "collection"
    | "profile"
    | "orders"
    | "order_detail"
    | "wishlist"
    | "checkout"
    | "policy"
    | "support";
  currentPath: string;
  title: string;
  welcome: string;
  suggestions: string[];
  productId?: string;
  productTitle?: string;
  collectionSlug?: string;
  orderId?: string;
};

export type AssistantApiResponse = {
  status: boolean;
  sessionId?: string;
  messageId?: string;
  message?: string;
  intent?: string;
  cards?: AssistantCard[];
  suggestions?: string[];
  replyTo?: AssistantMessage["replyTo"];
};

export type AssistantSessionSummary = {
  sessionId: string;
  title?: string;
  status: "active" | "closed";
  lastIntent?: string | null;
  lastMessageAt?: string;
  createdAt?: string;
  isAuthenticated?: boolean;
};
