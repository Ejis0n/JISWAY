import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim();

  const orders = await prisma.order.findMany({
    where: q
      ? {
          OR: [
            { id: { contains: q, mode: "insensitive" } },
            { stripeCheckoutSessionId: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Stripe-paid orders.</div>
        </div>
        <form className="flex items-center gap-2" method="get">
          <label className="text-sm">
            <span className="sr-only">Search</span>
            <input
              name="q"
              defaultValue={q || ""}
              placeholder="Search (id, email, session)"
              className="w-64 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <button className="rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800">
            Search
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {o.createdAt.toISOString().slice(0, 19).replace("T", " ")}
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  <Link className="underline underline-offset-4" href={`/admin/orders/${o.id}`}>
                    {o.id}
                  </Link>
                </td>
                <td className="px-4 py-3">{o.email ?? "—"}</td>
                <td className="px-4 py-3">${(o.totalUsd / 100).toFixed(2)}</td>
                <td className="px-4 py-3">{o.status}</td>
              </tr>
            ))}
            {orders.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-zinc-600 dark:text-zinc-300" colSpan={5}>
                  No orders.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

