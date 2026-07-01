"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import CartDrawer from "../cart/components/CartDrawer";
import type { CartItem, ProductSummary, RawCartItem } from "../cart/cart-types";
import { mapCartItems } from "../cart/cart-utils";
import { getUserToken } from "../utils/auth";

const API_BASE = "/api/user";
const getToken = () => getUserToken();

type CartResponse = { items?: RawCartItem[] };
type ProductsResponse = { products?: ProductSummary[]; data?: ProductSummary[] };

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function CartModal({ open, onClose }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState("");
  const [productMap, setProductMap] = useState<Record<string, ProductSummary>>({});
  const [loadingCart, setLoadingCart] = useState(false);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [clearingCart, setClearingCart] = useState(false);

  const requireAuth = () => {
    const token = getToken();
    if (!token) {
      onClose();
      router.push(`/login?next=${encodeURIComponent(pathname || "/")}`);
      return false;
    }
    return true;
  };

  const applyCartItems = (rows: RawCartItem[] = []) => {
    setItems(mapCartItems(rows, productMap));
    window.dispatchEvent(new Event("cart:updated"));
  };

  useEffect(() => {
    fetch(`${API_BASE}/show-product`)
      .then((response) => response.json() as Promise<ProductsResponse>)
      .then((data) => {
        const nextMap: Record<string, ProductSummary> = {};
        (data.products || data.data || []).forEach((product) => {
          const id = String(product.product_id || product._id || "");
          if (id) nextMap[id] = product;
        });
        setProductMap(nextMap);
      })
      .catch(() => setProductMap({}));
  }, []);

  useEffect(() => {
    if (!open) return;
    const stored = localStorage.getItem("cart_id") || "";
    setCartId(stored);
    if (!stored) {
      setItems([]);
      setLoadingCart(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !cartId) return;
    setLoadingCart(true);
    fetch(`${API_BASE}/get-user-cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-token": getToken() },
      body: JSON.stringify({ cart_id: cartId }),
    })
      .then((response) => response.json() as Promise<CartResponse>)
      .then((data) => setItems(mapCartItems(data.items || [], productMap)))
      .catch(() => setItems([]))
      .finally(() => setLoadingCart(false));
  }, [cartId, open, productMap]);

  useEffect(() => {
    if (!open) return;
    const loadWishlist = async () => {
      const email = (localStorage.getItem("user_email") || "").trim();
      localStorage.setItem("user_email", email);
      try {
        const response = await fetch(`${API_BASE}/wishlist/list`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-user-token": getToken() },
          body: JSON.stringify({ email }),
        });
        const data = (await response.json()) as { products?: ProductSummary[] };
        const ids = (data.products || []).map((product) => String(product.product_id || product._id || ""));
        setWishlistIds(new Set(ids));
      } catch {
        setWishlistIds(new Set());
      }
    };
    loadWishlist();
    window.addEventListener("wishlist:updated", loadWishlist as EventListener);
    return () => window.removeEventListener("wishlist:updated", loadWishlist as EventListener);
  }, [open]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const mrpTotal = items.reduce((sum, item) => sum + (item.mrp ?? item.price) * item.qty, 0);
    return { subtotal, mrpTotal };
  }, [items]);

  const updateQty = async (item: CartItem, nextQty: number) => {
    if (!cartId) return;
    const response = await fetch(`${API_BASE}/update-cart-item`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-token": getToken() },
      body: JSON.stringify({
        cart_id: cartId,
        product_id: item.id,
        color: item.color || "",
        size: item.size || "",
        qty: nextQty,
      }),
    });
    const data = (await response.json()) as CartResponse;
    if (data.items) applyCartItems(data.items);
  };

  const removeItem = async (item: CartItem) => {
    if (!cartId) return;
    const params = new URLSearchParams({
      cart_id: cartId,
      color: item.color || "",
      size: item.size || "",
    });
    const response = await fetch(`${API_BASE}/remove-cart-by-product/${item.id}?${params}`);
    const data = (await response.json()) as CartResponse;
    if (data.items) applyCartItems(data.items);
  };

  const clearCart = async () => {
    if (!cartId || clearingCart) return;
    setClearingCart(true);
    try {
      const response = await fetch(`${API_BASE}/clear-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-token": getToken() },
        body: JSON.stringify({ cart_id: cartId }),
      });
      const data = (await response.json()) as CartResponse;
      if (data.items) applyCartItems(data.items);
    } finally {
      setClearingCart(false);
    }
  };

  const toggleWishlist = async (item: CartItem) => {
    if (!requireAuth()) return;
    const email = (localStorage.getItem("user_email") || "").trim();
    const endpoint = wishlistIds.has(String(item.id)) ? "/wishlist/remove" : "/wishlist/add";
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-token": getToken() },
      body: JSON.stringify({ email, product_id: item.id }),
    });
    const data = (await response.json()) as { products?: ProductSummary[] };
    const ids = (data.products || []).map((product) => String(product.product_id || product._id || ""));
    setWishlistIds(new Set(ids));
    window.dispatchEvent(new Event("wishlist:updated"));
  };

  const checkout = () => {
    if (!requireAuth()) return;
    localStorage.removeItem("buy_now_item");
    onClose();
    router.push("/checkout");
  };

  return (
    <CartDrawer
      open={open}
      items={items}
      loading={loadingCart}
      clearing={clearingCart}
      wishlistIds={wishlistIds}
      totals={totals}
      onClose={onClose}
      onClear={clearCart}
      onCheckout={checkout}
      onRemove={removeItem}
      onToggleWishlist={toggleWishlist}
      onUpdateQty={updateQty}
    />
  );
}
