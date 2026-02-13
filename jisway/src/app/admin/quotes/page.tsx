import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminQuotesPage() {
  const quotes = await prisma.quoteRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Quote requests</h1>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Subtotal</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {quotes.map((q) => (
              <tr key={q.id}>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {q.createdAt.toISOString().slice(0, 19).replace("T", " ")}
                </td>
                <td className="px-4 py-3">{q.email}</td>
                <td className="px-4 py-3">
                  {q.subtotalUsd != null ? `$${(q.subtotalUsd / 100).toFixed(2)}` : "—"}
                </td>
                <td className="px-4 py-3">{q.status}</td>
                <td className="px-4 py-3 text-right">
                  <Link className="underline underline-offset-4" href={`/admin/quotes/${q.id}`}>
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {quotes.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-zinc-600 dark:text-zinc-300" colSpan={5}>
                  No quote requests.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

