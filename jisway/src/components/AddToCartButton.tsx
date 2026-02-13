"use client";

import { useMemo, useState } from "react";
import { useCartStore } from "@/stores/cartStore";

async function logAddToCart(variantId: string) {
  try {
    await fetch("/api/event", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "AddToCart", path: window.location.pathname, variantId }),
      keepalive: true,
    });
  } catch {
    // ignore
  }
}

export function AddToCartButton({
  variantId,
  disabled,
}: {
  variantId: string;
  disabled?: boolean;
}) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const isDisabled = useMemo(() => disabled || !variantId, [disabled, variantId]);
  const add = useCartStore((s) => s.add);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm">
        <span className="text-zinc-600 dark:text-zinc-300">Qty</span>
        <input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value || 1))}
          className="w-24 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
        />
      </label>
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => {
          add(variantId, qty);
          void logAddToCart(variantId);
          setAdded(true);
          window.setTimeout(() => setAdded(false), 1200);
        }}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        Add to Cart
      </button>
      {added ? <div className="text-sm text-zinc-600 dark:text-zinc-300">Added.</div> : null}
    </div>
  );
}

