"use client";

export type CartItem = { variantId: string; quantity: number };

const KEY = "jisway_cart_v1";

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => {
        if (!x || typeof x !== "object") return null;
        const v = x as { variantId?: unknown; quantity?: unknown };
        if (typeof v.variantId !== "string") return null;
        const q = typeof v.quantity === "number" ? v.quantity : Number(v.quantity);
        if (!Number.isFinite(q) || q <= 0) return null;
        return { variantId: v.variantId, quantity: Math.floor(q) };
      })
      .filter((x): x is CartItem => Boolean(x));
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export function addToCart(variantId: string, quantity: number) {
  const q = Math.max(1, Math.floor(quantity));
  const items = readCart();
  const idx = items.findIndex((i) => i.variantId === variantId);
  if (idx >= 0) items[idx] = { variantId, quantity: items[idx].quantity + q };
  else items.push({ variantId, quantity: q });
  writeCart(items);
}

export function updateQuantity(variantId: string, quantity: number) {
  const q = Math.max(0, Math.floor(quantity));
  const items = readCart();
  const next = items
    .map((i) => (i.variantId === variantId ? { ...i, quantity: q } : i))
    .filter((i) => i.quantity > 0);
  writeCart(next);
}

export function removeFromCart(variantId: string) {
  const items = readCart();
  writeCart(items.filter((i) => i.variantId !== variantId));
}

export function clearCart() {
  window.localStorage.removeItem(KEY);
}

