"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = { variantId: string; quantity: number };

type CartState = {
  items: CartItem[];
  add: (variantId: string, quantity?: number) => void;
  inc: (variantId: string) => void;
  dec: (variantId: string) => void;
  setQty: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
};

function clampQty(n: number) {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.floor(n));
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (variantId, quantity = 1) => {
        const q = clampQty(quantity);
        const items = get().items.slice();
        const idx = items.findIndex((i) => i.variantId === variantId);
        if (idx >= 0) items[idx] = { variantId, quantity: items[idx].quantity + q };
        else items.push({ variantId, quantity: q });
        set({ items });
      },
      inc: (variantId) => get().add(variantId, 1),
      dec: (variantId) => {
        const items = get().items
          .map((i) =>
            i.variantId === variantId ? { ...i, quantity: Math.max(0, i.quantity - 1) } : i,
          )
          .filter((i) => i.quantity > 0);
        set({ items });
      },
      setQty: (variantId, quantity) => {
        const q = clampQty(quantity);
        const items = get().items.slice();
        const idx = items.findIndex((i) => i.variantId === variantId);
        if (idx >= 0) items[idx] = { variantId, quantity: q };
        else items.push({ variantId, quantity: q });
        set({ items });
      },
      remove: (variantId) => set({ items: get().items.filter((i) => i.variantId !== variantId) }),
      clear: () => set({ items: [] }),
    }),
    {
      name: "jisway_cart_v2",
      version: 2,
    },
  ),
);

