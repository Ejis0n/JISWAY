"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { CatalogVariant } from "@/lib/catalog";
import { seoTitle } from "@/lib/seo/templates";

type CatalogMap = Record<string, CatalogVariant>;

export function OfferFormClient({
  initialVariantId,
  catalog,
}: {
  initialVariantId?: string | null;
  catalog: CatalogVariant[];
}) {
  const map: CatalogMap = useMemo(() => {
    const m: CatalogMap = {};
    for (const v of catalog) m[v.id] = v;
    return m;
  }, [catalog]);

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("");
  const [variantId, setVariantId] = useState(initialVariantId ?? "");
  const [offeredPriceUsd, setOfferedPriceUsd] = useState("");
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        email: email.trim(),
        name: name.trim() || undefined,
        company: company.trim() || undefined,
        country: country.trim() || undefined,
        message: message.trim() || undefined,
      };
      if (variantId.trim()) body.variantId = variantId.trim();
      const price = offeredPriceUsd.trim() ? parseFloat(offeredPriceUsd) : undefined;
      if (price != null && !Number.isNaN(price) && price > 0) body.offeredPriceUsd = price;
      const qty = quantity.trim() ? parseInt(quantity, 10) : undefined;
      if (qty != null && !Number.isNaN(qty) && qty > 0) body.quantity = qty;

      const res = await fetch("/api/offer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
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
        <p className="font-medium">Offer submitted.</p>
        <p className="mt-2 text-zinc-600 dark:text-zinc-300">
          We will reply to your contact email.
        </p>
        <div className="mt-4">
          <Link
            href="/"
            className="text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-white"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const variantOptions = catalog.map((v) => (
    <option key={v.id} value={v.id}>
      {seoTitle(v)} — ${v.price_usd.toFixed(2)}
    </option>
  ));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Make an offer</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Send your desired price, quantity, and product. We will review and reply.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-xs font-semibold text-zinc-500">Email <span className="text-red-500">*</span></span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-semibold text-zinc-500">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-semibold text-zinc-500">Company</span>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-semibold text-zinc-500">Country</span>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-xs font-semibold text-zinc-500">Product (optional)</span>
            <select
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="">— None —</option>
              {variantOptions}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-xs font-semibold text-zinc-500">Desired unit price (USD)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="1.99"
              value={offeredPriceUsd}
              onChange={(e) => setOfferedPriceUsd(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-semibold text-zinc-500">Quantity (packs)</span>
            <input
              type="number"
              min="1"
              placeholder="10"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-xs font-semibold text-zinc-500">Message</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
        </div>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {loading ? "Submitting…" : "Submit offer"}
          </button>
          <Link
            href="/"
            className="rounded-md border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
