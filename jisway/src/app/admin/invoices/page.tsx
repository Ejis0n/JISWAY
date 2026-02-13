import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminInvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Invoices (wire / USDT)</h1>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {inv.createdAt.toISOString().slice(0, 19).replace("T", " ")}
                </td>
                <td className="px-4 py-3">{inv.paymentMethod}</td>
                <td className="px-4 py-3">${(inv.amountUsd / 100).toFixed(2)}</td>
                <td className="px-4 py-3">{inv.dueDate.toISOString().slice(0, 10)}</td>
                <td className="px-4 py-3">{inv.status}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <Link className="underline underline-offset-4" href={`/invoice/${inv.token}`}>
                      Hosted
                    </Link>
                    <form action={`/api/admin/invoices/${inv.id}/mark-paid`} method="post">
                      <button className="text-xs underline underline-offset-4">Mark paid</button>
                    </form>
                    <form action={`/api/admin/invoices/${inv.id}/expire`} method="post">
                      <button className="text-xs underline underline-offset-4">Expire</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {invoices.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-zinc-600 dark:text-zinc-300" colSpan={6}>
                  No invoices.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

