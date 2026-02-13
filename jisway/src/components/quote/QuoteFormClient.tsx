"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CatalogVariant } from "@/lib/catalog";
import { useCartStore, type CartItem } from "@/stores/cartStore";
import { buildSeoSlug } from "@/lib/seo/slug";
import { seoTitle } from "@/lib/seo/templates";

type CatalogMap = Record<string, CatalogVariant>;

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

export function QuoteFormClient({ catalog }: { catalog: CatalogVariant[] }) {
  const map: CatalogMap = useMemo(() => {
    const m: CatalogMap = {};
    for (const v of catalog) m[v.id] = v;
    return m;
  }, [catalog]);

  const cart = useCartStore((s) => s.items);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [notes, setNotes] = useState("");
  const [ackNoSubstitutes, setAckNoSubstitutes] = useState(false);
  const [ackProcuredAfterPay, setAckProcuredAfterPay] = useState(false);
  const [ackDutiesRefund, setAckDutiesRefund] = useState(false);

  // no-op: cart is persisted client-side via zustand

  const enriched = cart
    .map((i) => {
      const v = map[i.variantId];
      if (!v) return null;
      return { ...i, v, line: v.price_usd * i.quantity };
    })
    .filter(Boolean) as Array<CartItem & { v: CatalogVariant; line: number }>;

  const subtotal = enriched.reduce((sum, x) => sum + x.line, 0);
  const acksOk = ackNoSubstitutes && ackProcuredAfterPay && ackDutiesRefund;

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          company,
          email,
          country,
          notes,
          cartItems: cart,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error || `Request failed (${res.status})`);
      }
      setOk(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  if (ok) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        Quote request submitted. We will email you with next steps.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Request a Quote</h1>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="font-semibold">Cart summary</div>
        {enriched.length === 0 ? (
          <div className="mt-2 text-zinc-600 dark:text-zinc-300">
            Cart is empty. <Link className="underline underline-offset-4" href="/jis">Browse catalog</Link>.
          </div>
        ) : (
          <>
            <ul className="mt-3 space-y-2">
              {enriched.map(({ v, quantity, line }) => (
                <li key={v.id} className="flex items-start justify-between gap-4">
                  <div>
                    <Link
                      className="underline underline-offset-4"
                      href={`/jis/${v.category}/${buildSeoSlug(v)}`}
                    >
                      {seoTitle(v)}
                    </Link>
                    <div className="text-xs text-zinc-500">Qty {quantity}</div>
                  </div>
                  <div className="font-medium">{money(line)}</div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-zinc-600 dark:text-zinc-300">Subtotal</div>
              <div className="font-semibold">{money(subtotal)}</div>
            </div>
          </>
        )}
        <div className="mt-4 text-xs text-zinc-500">
          Import duties and taxes are the responsibility of the recipient.
        </div>
        <div className="mt-4 text-xs text-zinc-500">
          All items are procured after payment/approval. Processing begins immediately after confirmation.
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <div className="text-xs font-semibold text-zinc-500">Name *</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <div className="text-xs font-semibold text-zinc-500">Company *</div>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <div className="text-xs font-semibold text-zinc-500">Email *</div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <div className="text-xs font-semibold text-zinc-500">Country *</div>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <div className="text-xs font-semibold text-zinc-500">Notes</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
        </div>

        <div className="mt-5 rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-xs font-semibold text-zinc-500">Acknowledgements</div>
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
              <span>I understand items are procured after payment confirmation (or after invoice/quote approval) and may require processing time.</span>
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

        {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            disabled={loading || !email || !name || !company || !country || enriched.length === 0 || !acksOk}
            onClick={submit}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {loading ? "Submitting…" : "Submit quote request"}
          </button>
          <Link
            href="/cart"
            className="rounded-md border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            Back to cart
          </Link>
        </div>
      </div>
    </div>
  );
}

