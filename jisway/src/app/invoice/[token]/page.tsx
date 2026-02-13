import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type InvoiceWithQuotes = Prisma.InvoiceGetPayload<{ include: { quoteRequests: true } }> | null;

export const dynamic = "force-dynamic";

export default async function HostedInvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let invoice: InvoiceWithQuotes = null;
  try {
    invoice = await prisma.invoice.findUnique({
      where: { token },
      include: { quoteRequests: true },
    });
  } catch {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Invoice</h1>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm dark:border-amber-800 dark:bg-amber-950/30">
          <p className="font-medium text-amber-800 dark:text-amber-200">
            This page is temporarily unavailable. Please try again in a few minutes.
          </p>
          <p className="mt-2 text-amber-700 dark:text-amber-300">
            If the problem persists, contact support with your invoice link.
          </p>
        </div>
        <Link className="text-sm underline underline-offset-4" href="/jis">
          Back to catalog
        </Link>
      </div>
    );
  }
  if (!invoice) return notFound();

  try {
    await prisma.appEvent.create({
      data: {
        type: "invoice_view",
        meta: { invoiceId: invoice.id, token },
      },
    });
  } catch {
    // 証跡は重要だが、表示は継続する
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoice</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Payment method: {invoice.paymentMethod}
          </p>
        </div>
        <Link className="text-sm underline underline-offset-4" href="/jis">
          Back to catalog
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold text-zinc-500">Invoice ID</div>
            <div className="mt-1 font-medium">{invoice.id}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-500">Amount</div>
            <div className="mt-1 text-lg font-semibold">${(invoice.amountUsd / 100).toFixed(2)} USD</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-500">Due date</div>
            <div className="mt-1 font-medium">{invoice.dueDate.toISOString().slice(0, 10)}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-500">Status</div>
            <div className="mt-1 font-medium">{invoice.status}</div>
          </div>
          {invoice.quoteRequests.length ? (
            <div>
              <div className="text-xs font-semibold text-zinc-500">Quote</div>
              <div className="mt-1 font-medium">{invoice.quoteRequests[0].id}</div>
            </div>
          ) : null}
        </div>

        <div className="mt-6">
          <div className="text-xs font-semibold text-zinc-500">Payment instructions</div>
          <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-zinc-200 bg-white p-4 text-xs dark:border-zinc-800 dark:bg-zinc-950">
            {invoice.paymentInstructions}
          </pre>
        </div>

        <div className="mt-6 text-xs text-zinc-500">
          <div className="font-semibold text-zinc-700 dark:text-zinc-200">Notes</div>
          <ul className="mt-2 list-disc pl-5">
            <li>No substitutes. Exact JIS specification.</li>
            <li>Procured through Japan-based industrial supply chain.</li>
            <li>Import duties and taxes are the responsibility of the recipient.</li>
            <li>Quote/invoice orders are final sale except supplier/shipping errors by us.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

