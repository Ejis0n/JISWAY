"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CatalogVariant } from "@/lib/catalog";
import { useCartStore, type CartItem } from "@/stores/cartStore";
import { buildSeoSlug } from "@/lib/seo/slug";
import { seoTitle } from "@/lib/seo/templates";

type CatalogMap = Record<string, CatalogVariant>;

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

type ShippingQuote = {
  zone: { id: string; name: string };
  carrier: "JP_POST" | "DHL";
  shipping_price_usd: number;
  eta_min_days: number;
  eta_max_days: number;
  tracking_included: boolean;
  warning_note?: string | null;
  duties_note: string;
  forced_dhl: boolean;
} | null;

export function CartPageClient({
  catalog,
  quoteThresholdUsd,
}: {
  catalog: CatalogVariant[];
  quoteThresholdUsd: number;
}) {
  const map: CatalogMap = useMemo(() => {
    const m: CatalogMap = {};
    for (const v of catalog) m[v.id] = v;
    return m;
  }, [catalog]);

  const items = useCartStore((s) => s.items);
  const inc = useCartStore((s) => s.inc);
  const dec = useCartStore((s) => s.dec);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);
  const setQty = useCartStore((s) => s.setQty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState<string>("");
  const [shipQuote, setShipQuote] = useState<ShippingQuote>(null);
  const [shipLoading, setShipLoading] = useState(false);
  const [ackNoSubstitutes, setAckNoSubstitutes] = useState(false);
  const [ackProcuredAfterPay, setAckProcuredAfterPay] = useState(false);
  const [ackDutiesRefund, setAckDutiesRefund] = useState(false);

  const enriched = items
    .map((i) => {
      const v = map[i.variantId];
      if (!v) return null;
      return { ...i, v, line: v.price_usd * i.quantity };
    })
    .filter(Boolean) as Array<CartItem & { v: CatalogVariant; line: number }>;

  const subtotal = enriched.reduce((sum, x) => sum + x.line, 0);
  const needsQuote = subtotal >= quoteThresholdUsd;
  const shipping = shipQuote?.shipping_price_usd ?? 0;
  const total = subtotal + shipping;
  const countryValid = /^[A-Z]{2}$/.test((countryCode || "").trim().toUpperCase());
  const acksOk = ackNoSubstitutes && ackProcuredAfterPay && ackDutiesRefund;
  const canCheckout = countryValid && acksOk && !needsQuote;

  const shipItems = useMemo(
    () => items.map((x) => ({ variantId: x.variantId, quantity: x.quantity })),
    [items],
  );

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("jisway_country");
      if (saved && /^[A-Za-z]{2}$/.test(saved)) setCountryCode(saved.toUpperCase());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      const cc = countryCode.trim().toUpperCase();
      if (cc.length === 2) window.localStorage.setItem("jisway_country", cc);
    } catch {
      // ignore
    }
  }, [countryCode]);

  useEffect(() => {
    if (shipItems.length === 0) {
      setShipQuote(null);
      return;
    }
    const cc = (countryCode || "ZZ").toUpperCase();
    if (!/^[A-Z]{2}$/.test(cc)) {
      setShipQuote(null);
      return;
    }
    const ac = new AbortController();
    setShipLoading(true);
    void fetch("/api/shipping/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        countryCode: cc,
        items: shipItems,
      }),
      signal: ac.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const j = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(j?.error || `Shipping quote failed (${res.status})`);
        }
        return (await res.json()) as ShippingQuote;
      })
      .then((j) => setShipQuote(j))
      .catch((e) => {
        if (e instanceof Error && e.name === "AbortError") return;
        setShipQuote(null);
      })
      .finally(() => setShipLoading(false));
    return () => ac.abort();
  }, [countryCode, shipItems]);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      void fetch("/api/event", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "StartCheckout", path: "/cart" }),
        keepalive: true,
      });
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          countryCode: countryCode.toUpperCase(),
          ack_exact_spec: ackNoSubstitutes,
          ack_no_inventory: ackProcuredAfterPay,
          ack_duties_taxes: ackDutiesRefund,
          ack_refund_policy: ackDutiesRefund,
          items: items,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error || `Checkout failed (${res.status})`);
      }
      const j = (await res.json()) as { url: string };
      window.location.assign(j.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cart</h1>
      </div>

      {enriched.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          Cart is empty.
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Pack</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Unit price</th>
                  <th className="px-4 py-3">Line total</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {enriched.map(({ variantId, quantity, v, line }) => (
                  <tr key={variantId} className="align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        <Link
                          className="underline underline-offset-4"
                          href={`/jis/${v.category}/${buildSeoSlug(v)}`}
                        >
                          {seoTitle(v)}
                        </Link>
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {v.size}
                        {v.length_mm ? `×${v.length_mm}` : ""} · {v.finish}
                      </div>
                    </td>
                    <td className="px-4 py-3">{v.pack_qty}pcs</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          className="h-9 w-9 rounded-md border border-zinc-200 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                          onClick={() => dec(variantId)}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={1}
                          aria-label="Quantity"
                          value={quantity}
                          onChange={(e) => setQty(variantId, Number(e.target.value || 1))}
                          className="w-20 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                        />
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          className="h-9 w-9 rounded-md border border-zinc-200 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                          onClick={() => inc(variantId)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">{money(v.price_usd)}</td>
                    <td className="px-4 py-3">{money(line)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="text-xs underline underline-offset-4 text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
                        onClick={() => remove(variantId)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-sm font-medium">Destination country</div>
                <div className="text-xs text-zinc-500">Enter 2-letter ISO code (e.g. US, DE, VN, JP, AU).</div>
              </div>
              <label className="text-sm">
                <span className="sr-only">Country code</span>
                <input
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value.toUpperCase().slice(0, 2))}
                  className="w-24 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  placeholder="—"
                  inputMode="text"
                  aria-invalid={countryCode.length > 0 && !countryValid}
                />
              </label>
            </div>
            {countryCode.length > 0 && !countryValid ? (
              <div className="mb-3 text-xs text-amber-700 dark:text-amber-300">Enter a valid 2-letter country code.</div>
            ) : null}

            <div className="flex items-center justify-between text-sm">
              <div className="text-zinc-600 dark:text-zinc-300">Subtotal</div>
              <div className="font-semibold">{money(subtotal)}</div>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <div className="text-zinc-600 dark:text-zinc-300">
                Shipping {shipQuote ? `(${shipQuote.carrier})` : "(estimate)"}
              </div>
              <div className="font-semibold">{shipLoading ? "…" : money(shipping)}</div>
            </div>
            {shipQuote ? (
              <div className="mt-2 text-xs text-zinc-500">
                Estimated delivery: {shipQuote.eta_min_days}-{shipQuote.eta_max_days} business days · Zone: {shipQuote.zone.name}
              </div>
            ) : null}
            {shipQuote?.warning_note ? (
              <div className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                Note: {shipQuote.warning_note}
              </div>
            ) : null}
            <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="text-xs font-semibold text-zinc-500">Checkout acknowledgements</div>
              <div className="mt-3 space-y-2">
                <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                  <input
                    type="checkbox"
                    checked={ackNoSubstitutes}
                    onChange={(e) => setAckNoSubstitutes(e.target.checked)}
                    className="mt-1"
                  />
                  <span>I confirm the specification (size/length/pack) and accept no substitutes.</span>
                </label>
                <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                  <input
                    type="checkbox"
                    checked={ackProcuredAfterPay}
                    onChange={(e) => setAckProcuredAfterPay(e.target.checked)}
                    className="mt-1"
                  />
                  <span>I understand items are procured after payment confirmation and may require processing time.</span>
                </label>
                <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                  <input
                    type="checkbox"
                    checked={ackDutiesRefund}
                    onChange={(e) => setAckDutiesRefund(e.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    I accept responsibility for duties/taxes and agree to the{" "}
                    <Link className="underline underline-offset-4" href="/policies/refund">
                      Refund Policy
                    </Link>
                    .
                  </span>
                </label>
              </div>
            </div>
            <div className="mt-2 text-xs text-zinc-500">Import duties and taxes are the responsibility of the recipient.</div>
            <div className="mt-2 text-xs text-zinc-500">All items are procured after payment. Processing begins immediately after confirmation.</div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <div className="text-zinc-600 dark:text-zinc-300">Total</div>
              <div className="font-semibold">{money(total)}</div>
            </div>
            <div className="mt-3 text-xs text-zinc-500">
              {needsQuote
                ? "This order requires a quote."
                : !countryValid
                  ? "Select your destination country to see shipping and checkout."
                  : `Checkout available for orders under ${money(quoteThresholdUsd)}.`}
            </div>
            {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}
            <div className="mt-5 flex flex-wrap gap-3">
              {!needsQuote ? (
                <button
                  disabled={loading || !canCheckout}
                  onClick={startCheckout}
                  className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  {loading ? "Redirecting…" : "Checkout"}
                </button>
              ) : (
                <Link
                  href="/quote?from=cart"
                  className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  Request a Quote
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  clear();
                }}
                className="rounded-md border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
              >
                Clear cart
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

