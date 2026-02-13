import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "requested", "confirmed", "received", "shipped", "closed", "canceled"] as const;

export default async function AdminProcurementTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim();
  const status = sp.status && (STATUSES as readonly string[]).includes(sp.status) ? sp.status : undefined;

  const tasks = await prisma.procurementTask.findMany({
    where: {
      ...(status ? { status: status as (typeof STATUSES)[number] } : {}),
      ...(q
        ? {
            OR: [
              { id: { contains: q, mode: "insensitive" } },
              { orderId: { contains: q, mode: "insensitive" } },
              { order: { email: { contains: q, mode: "insensitive" } } },
              { supplier: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: { order: true, supplier: true, _count: { select: { lines: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Procurement Tasks</h1>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Created from paid orders. One task per order (v1).
          </div>
        </div>
        <form className="flex flex-wrap items-center gap-2" method="get">
          <label className="text-sm">
            <span className="sr-only">Search</span>
            <input
              name="q"
              defaultValue={q || ""}
              placeholder="Search (task/order/email/supplier)"
              className="w-72 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="text-sm">
            <span className="sr-only">Status</span>
            <select
              name="status"
              defaultValue={status || ""}
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <button className="rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800">
            Apply
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Task</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Lines</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {tasks.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {t.createdAt.toISOString().slice(0, 19).replace("T", " ")}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{t.id}</td>
                <td className="px-4 py-3 font-mono text-xs">{t.orderId}</td>
                <td className="px-4 py-3">{t.supplier?.name ?? "—"}</td>
                <td className="px-4 py-3">{t._count.lines}</td>
                <td className="px-4 py-3">{t.status}</td>
                <td className="px-4 py-3 text-right">
                  <Link className="underline underline-offset-4" href={`/admin/procurement/${t.id}`}>
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {tasks.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-zinc-600 dark:text-zinc-300" colSpan={7}>
                  No tasks.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

