"use client";

import Link from "next/link";
import { useState } from "react";

type Category = "misorder" | "damage" | "lost" | "customs" | "billing" | "other";

export function SupportFormClient() {
  const [email, setEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState<Category>("damage");
  const [message, setMessage] = useState("");
  const [attachmentUrls, setAttachmentUrls] = useState("");
  const [loading, setLoading] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const urls = attachmentUrls
        .split(/\n|,/g)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 10);
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          order_id: orderId || undefined,
          country: country || undefined,
          category,
          message,
          attachment_urls: urls,
        }),
      });
      const j = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(j?.error || `Failed (${res.status})`);
      setTicketId(String(j.ticket_id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  if (ticketId) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="font-semibold">Ticket created</div>
        <div className="mt-2">
          Ticket number: <span className="font-mono">{ticketId}</span>
        </div>
        <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
          For damage claims, attach photos of the outer packaging and the item.
        </div>
        <div className="mt-4 text-xs text-zinc-500">
          Related: <Link className="underline underline-offset-4" href="/policies/refund">Refund Policy</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 rounded-lg border border-zinc-200 bg-white p-4 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
        <div className="text-xs font-semibold text-zinc-500">Before submitting</div>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Include your order ID (if available).</li>
          <li>Damage claims: attach photos of outer packaging/label and the item within 7 days of delivery.</li>
          <li>Non-delivery: open a case after 14 business days past ETA, or earlier if the carrier confirms loss.</li>
          <li>Misorders (wrong spec selected) are not refundable unless our listing was incorrect.</li>
        </ul>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
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
          <div className="text-xs font-semibold text-zinc-500">Order ID (optional)</div>
          <input
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          />
        </label>
        <label className="block text-sm">
          <div className="text-xs font-semibold text-zinc-500">Country (optional)</div>
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="US / VN / DE"
            className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          />
        </label>
        <label className="block text-sm">
          <div className="text-xs font-semibold text-zinc-500">Category *</div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <option value="misorder">misorder</option>
            <option value="damage">damage</option>
            <option value="lost">lost</option>
            <option value="customs">customs</option>
            <option value="billing">billing</option>
            <option value="other">other</option>
          </select>
        </label>
        <label className="block text-sm sm:col-span-2">
          <div className="text-xs font-semibold text-zinc-500">Message *</div>
          <textarea
            required
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <div className="text-xs font-semibold text-zinc-500">Attachment URLs (optional)</div>
          <textarea
            rows={3}
            value={attachmentUrls}
            onChange={(e) => setAttachmentUrls(e.target.value)}
            placeholder="Paste photo/doc URLs (one per line)"
            className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          />
          <div className="mt-1 text-xs text-zinc-500">
            For damage: include packaging + item photos within 7 days of delivery.
          </div>
        </label>
      </div>

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          disabled={loading || !email || !message}
          onClick={submit}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {loading ? "Submitting…" : "Submit ticket"}
        </button>
        <div className="text-xs text-zinc-500">
          By submitting, you agree to the <Link className="underline underline-offset-4" href="/policies/terms">Terms</Link>.
        </div>
      </div>
    </div>
  );
}

