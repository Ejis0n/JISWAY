"use client";

import { useEffect, useState } from "react";

export function ProcureFormClient() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [specText, setSpecText] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const sku = sp.get("sku") || "";
      if (sku && !specText.trim()) setSpecText(`SKU: ${sku}\n`);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/procure", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          company,
          email,
          country,
          specText,
          quantity,
          notes,
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
        Procurement request submitted. We will email you with next steps.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Procurement Request</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Provide the required spec and quantity. Exact JIS specification only.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="font-semibold">Notes</div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-600 dark:text-zinc-300">
          <li>No substitutes. Exact JIS specification.</li>
          <li>Procured through Japan-based industrial supply chain.</li>
          <li>Import duties and taxes are the responsibility of the recipient.</li>
        </ul>
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
            <div className="text-xs font-semibold text-zinc-500">Required spec fields *</div>
            <textarea
              value={specText}
              onChange={(e) => setSpecText(e.target.value)}
              rows={6}
              required
              placeholder="Example:\n- Standard: JIS\n- Category: bolt\n- Size: M12\n- Length: 50\n- Pack: 20pcs\n- Finish: zinc\n- Notes: ..."
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <div className="text-xs font-semibold text-zinc-500">Quantity (packs)</div>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value || 1))}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <div className="text-xs font-semibold text-zinc-500">Notes</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
        </div>

        {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}

        <div className="mt-5">
          <button
            disabled={loading || !name || !company || !email || !country || !specText.trim()}
            onClick={submit}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {loading ? "Submitting…" : "Submit procurement request"}
          </button>
        </div>
      </div>
    </div>
  );
}

