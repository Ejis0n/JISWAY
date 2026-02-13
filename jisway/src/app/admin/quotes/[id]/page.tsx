import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quote = await prisma.quoteRequest.findUnique({
    where: { id },
    include: { invoice: true },
  });
  if (!quote) return notFound();

  const snapshot = quote.cartSnapshot as { items?: Array<{ title?: string; seo_title?: string; qty: number; line_usd: number }> } | null;
  const items = snapshot?.items ?? [];
  const defaultDue = new Date(quote.createdAt.getTime() + 7 * 86400000).toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quote {quote.id}</h1>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{quote.email}</div>
        </div>
        <Link className="text-sm underline underline-offset-4" href="/admin/quotes">
          Back
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-xs font-semibold text-zinc-500">Status</div>
          <div className="mt-1 font-medium">{quote.status}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <form action={`/api/admin/quotes/${quote.id}/status`} method="post">
              <input type="hidden" name="status" value="IN_PROGRESS" />
              <button className="rounded-md border border-zinc-200 px-3 py-2 text-xs hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800">
                Set In progress
              </button>
            </form>
            <form action={`/api/admin/quotes/${quote.id}/status`} method="post">
              <input type="hidden" name="status" value="REJECTED" />
              <button className="rounded-md border border-zinc-200 px-3 py-2 text-xs hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800">
                Reject
              </button>
            </form>
          </div>
          <div className="mt-4 text-xs font-semibold text-zinc-500">Subtotal</div>
          <div className="mt-1 font-medium">
            {quote.subtotalUsd != null ? `$${(quote.subtotalUsd / 100).toFixed(2)}` : "—"}
          </div>
          {quote.message ? (
            <>
              <div className="mt-4 text-xs font-semibold text-zinc-500">Notes</div>
              <div className="mt-1 whitespace-pre-wrap">{quote.message}</div>
            </>
          ) : null}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="font-semibold">Cart snapshot</div>
          {items.length ? (
            <ul className="mt-3 space-y-2">
              {items.map((it, idx) => (
                <li key={idx} className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium">{it.title ?? it.seo_title ?? "Item"}</div>
                    <div className="text-xs text-zinc-500">Qty {it.qty}</div>
                  </div>
                  <div className="font-medium">${it.line_usd.toFixed(2)}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-2 text-zinc-600 dark:text-zinc-300">No snapshot.</div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="font-semibold">Approve: Stripe Invoice</div>
          <form className="mt-3 space-y-2" action={`/api/admin/quotes/${quote.id}/approve/stripe`} method="post">
            <label className="block">
              <div className="text-xs font-semibold text-zinc-500">Amount (USD)</div>
              <input name="amount_usd" defaultValue={quote.subtotalUsd ? (quote.subtotalUsd / 100).toFixed(2) : ""} className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" />
            </label>
            <label className="block">
              <div className="text-xs font-semibold text-zinc-500">Due in days</div>
              <input name="days_until_due" defaultValue="7" className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" />
            </label>
            <button className="mt-2 w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
              Create & send Stripe invoice
            </button>
          </form>
          {quote.stripeInvoiceUrl ? (
            <div className="mt-3 text-xs">
              Existing:{" "}
              <a className="underline underline-offset-4" href={quote.stripeInvoiceUrl}>
                Stripe hosted invoice
              </a>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="font-semibold">Approve: Wire invoice</div>
          <form className="mt-3 space-y-2" action={`/api/admin/quotes/${quote.id}/approve/wire`} method="post">
            <label className="block">
              <div className="text-xs font-semibold text-zinc-500">Amount (USD)</div>
              <input name="amount_usd" defaultValue={quote.subtotalUsd ? (quote.subtotalUsd / 100).toFixed(2) : ""} className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" />
            </label>
            <label className="block">
              <div className="text-xs font-semibold text-zinc-500">Due date (YYYY-MM-DD)</div>
              <input
                name="due_date"
                defaultValue={defaultDue}
                className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              />
            </label>
            <label className="block">
              <div className="text-xs font-semibold text-zinc-500">Payment instructions</div>
              <textarea name="instructions" rows={5} defaultValue="Wire transfer instructions:\n- Beneficiary:\n- Bank:\n- Account number / IBAN:\n- SWIFT:\n- Reference: Quote ID" className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" />
            </label>
            <button className="mt-2 w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
              Create hosted wire invoice
            </button>
          </form>
          {quote.invoice ? (
            <div className="mt-3 text-xs">
              Hosted:{" "}
              <Link className="underline underline-offset-4" href={`/invoice/${quote.invoice.token}`}>
                /invoice/{quote.invoice.token}
              </Link>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="font-semibold">Approve: USDT invoice (TRC20)</div>
          <form className="mt-3 space-y-2" action={`/api/admin/quotes/${quote.id}/approve/usdt`} method="post">
            <label className="block">
              <div className="text-xs font-semibold text-zinc-500">Amount (USD)</div>
              <input name="amount_usd" defaultValue={quote.subtotalUsd ? (quote.subtotalUsd / 100).toFixed(2) : ""} className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" />
            </label>
            <label className="block">
              <div className="text-xs font-semibold text-zinc-500">Due date (YYYY-MM-DD)</div>
              <input
                name="due_date"
                defaultValue={defaultDue}
                className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              />
            </label>
            <label className="block">
              <div className="text-xs font-semibold text-zinc-500">Payment instructions</div>
              <textarea
                name="instructions"
                rows={5}
                defaultValue={`USDT (TRC20) payment instructions:\n- Network: TRC20\n- Wallet address: ${process.env.USDT_TRC20_ADDRESS || "[SET_USDT_TRC20_ADDRESS]"}\n- Reference: Quote ID`}
                className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              />
            </label>
            <button className="mt-2 w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
              Create hosted USDT invoice
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

