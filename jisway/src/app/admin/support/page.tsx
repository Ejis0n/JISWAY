import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "in_progress", "waiting_customer", "resolved", "rejected"] as const;
const CATEGORIES = ["misorder", "damage", "lost", "customs", "billing", "other"] as const;

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as any) ? (sp.status as any) : undefined;
  const category = CATEGORIES.includes(sp.category as any) ? (sp.category as any) : undefined;

  const tickets = await prisma.supportTicket.findMany({
    where: { ...(status ? { status } : {}), ...(category ? { category } : {}) },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Support</h1>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Tickets and dispute evidence.</div>
        </div>
        <Link className="text-sm underline underline-offset-4" href="/support">
          Open public support page
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs font-semibold text-zinc-500">Filters</div>
          <Link className="rounded-md border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-800" href="/admin/support">
            Clear
          </Link>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-500">Status:</span>
            {STATUSES.map((s) => (
              <Link
                key={s}
                className="rounded-md border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-800"
                href={`/admin/support?status=${s}${category ? `&category=${category}` : ""}`}
              >
                {s}
              </Link>
            ))}
            <span className="ml-2 text-xs text-zinc-500">Category:</span>
            {CATEGORIES.map((c) => (
              <Link
                key={c}
                className="rounded-md border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-800"
                href={`/admin/support?category=${c}${status ? `&status=${status}` : ""}`}
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {tickets.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3">
                  <Link className="underline underline-offset-4" href={`/admin/support/${t.id}`}>
                    {t.id}
                  </Link>
                </td>
                <td className="px-4 py-3">{t.status}</td>
                <td className="px-4 py-3">{t.category}</td>
                <td className="px-4 py-3">{t.email}</td>
                <td className="px-4 py-3">{t.orderId ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-zinc-500">{t.updatedAt.toISOString().slice(0, 19).replace("T", " ")}</td>
              </tr>
            ))}
            {tickets.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-zinc-600 dark:text-zinc-300" colSpan={6}>
                  No tickets.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

