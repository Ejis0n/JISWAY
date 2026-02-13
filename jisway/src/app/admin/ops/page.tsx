import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminOpsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string; from?: string; to?: string; country?: string }>;
}) {
  const sp = await searchParams;
  const tab = sp.tab === "ready" ? "ready" : "queue";
  const status = sp.status?.trim();
  const country = sp.country?.trim();

  const from = sp.from ? new Date(sp.from) : null;
  const to = sp.to ? new Date(sp.to) : null;

  const dateFilter =
    from || to
      ? {
          createdAt: {
            ...(from && !Number.isNaN(from.getTime()) ? { gte: from } : {}),
            ...(to && !Number.isNaN(to.getTime()) ? { lte: to } : {}),
          },
        }
      : {};

  const baseWhere = {
    status: "paid" as const,
    ...(country ? { country: { equals: country, mode: "insensitive" as const } } : {}),
    ...dateFilter,
  };

  const queue = await prisma.procurementTask.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(tab === "queue"
        ? { status: { in: ["new", "requested", "confirmed"] } }
        : { status: { in: ["received"] } }),
      order: baseWhere as any,
    },
    include: { order: true, supplier: true, _count: { select: { lines: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ops</h1>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Fulfillment checklist: procurement → ship.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href="/admin/ops?tab=queue"
            className={`rounded-md border px-3 py-2 ${
              tab === "queue"
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black"
                : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
            }`}
          >
            Procurement Queue
          </Link>
          <Link
            href="/admin/ops?tab=ready"
            className={`rounded-md border px-3 py-2 ${
              tab === "ready"
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black"
                : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
            }`}
          >
            Ready to Ship
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <form className="grid gap-3 sm:grid-cols-5" method="get">
          <input type="hidden" name="tab" value={tab} />
          <label className="block text-sm sm:col-span-2">
            <div className="text-xs font-semibold text-zinc-500">Country (2-letter)</div>
            <input
              name="country"
              defaultValue={country || ""}
              placeholder="JP / US / DE ..."
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <div className="text-xs font-semibold text-zinc-500">From</div>
            <input
              name="from"
              type="date"
              defaultValue={sp.from || ""}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <div className="text-xs font-semibold text-zinc-500">To</div>
            <input
              name="to"
              type="date"
              defaultValue={sp.to || ""}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <div className="flex items-end">
            <button className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800">
              Apply
            </button>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-3">Task</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Lines</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {queue.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3 font-mono text-xs">{t.id}</td>
                <td className="px-4 py-3 font-mono text-xs">{t.orderId}</td>
                <td className="px-4 py-3">{t.order.country ?? "—"}</td>
                <td className="px-4 py-3">{t.supplier?.name ?? "—"}</td>
                <td className="px-4 py-3">{t._count.lines}</td>
                <td className="px-4 py-3">{t.status}</td>
                <td className="px-4 py-3 text-right">
                  <Link className="underline underline-offset-4" href={`/admin/procurement/${t.id}`}>
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {queue.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-zinc-600 dark:text-zinc-300" colSpan={7}>
                  No items.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

