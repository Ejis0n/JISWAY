import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  IN_PROGRESS: "In progress",
  APPROVED: "Approved",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};

function formatCents(cents: number | null) {
  if (cents == null) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function AdminCustomerOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const statusFilter = sp.status?.trim();

  const offers = await prisma.customerOffer.findMany({
    where: statusFilter && ["NEW", "IN_PROGRESS", "APPROVED", "COMPLETED", "REJECTED"].includes(statusFilter)
      ? { status: statusFilter as "NEW" | "IN_PROGRESS" | "APPROVED" | "COMPLETED" | "REJECTED" }
      : undefined,
    include: {
      variant: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customer offers（客からのオファー）</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          お客様が送信したオファー一覧。対応後はステータスを更新してください。
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="block text-sm">
            <span className="text-xs font-semibold text-zinc-500">Status</span>
            <select
              name="status"
              defaultValue={statusFilter || ""}
              className="mt-1 block rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="">All</option>
              <option value="NEW">New</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="APPROVED">Approved</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </label>
          <button
            type="submit"
            className="rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            Apply
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Email / Name</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Offer price</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {offers.map((o) => (
                <tr key={o.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                    {o.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">
                      {STATUS_LABELS[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>{o.email}</div>
                    {(o.name || o.company) && (
                      <div className="text-xs text-zinc-500">
                        {[o.name, o.company].filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {o.variant ? (
                      <Link
                        href={`/jis/${o.variant.product.category}/${o.variant.slug}`}
                        className="font-mono text-xs underline underline-offset-2"
                      >
                        {o.variant.product.size} {o.variant.product.lengthMm ?? ""} {o.variant.packType}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">{formatCents(o.offeredPriceUsdCents)}</td>
                  <td className="px-4 py-3">{o.quantity ?? "—"}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-zinc-600 dark:text-zinc-300">
                    {o.message || "—"}
                  </td>
                </tr>
              ))}
              {offers.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-zinc-600 dark:text-zinc-300" colSpan={7}>
                    No customer offers.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
