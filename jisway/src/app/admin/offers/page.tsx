import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ supplier?: string; category?: string; size?: string }>;
}) {
  const sp = await searchParams;
  const supplier = sp.supplier?.trim();
  const category = sp.category?.trim();
  const size = sp.size?.trim().toUpperCase();

  const offers = await prisma.supplierOffer.findMany({
    where: {
      ...(supplier ? { supplier: { name: { contains: supplier, mode: "insensitive" } } } : {}),
      ...(category && ["bolt", "nut", "washer"].includes(category) ? { category: category as any } : {}),
      ...(size ? { size } : {}),
    },
    include: { supplier: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Supplier Offers</h1>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Manual + CSV ingested. Used by routing engine.
          </div>
        </div>
        <Link
          href="/admin/suppliers/import"
          className="rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
        >
          Import CSV
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <form method="get" className="grid gap-3 sm:grid-cols-4">
          <label className="block text-sm">
            <div className="text-xs font-semibold text-zinc-500">Supplier</div>
            <input
              name="supplier"
              defaultValue={supplier || ""}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <div className="text-xs font-semibold text-zinc-500">Category</div>
            <select
              name="category"
              defaultValue={category || ""}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="">All</option>
              <option value="bolt">bolt</option>
              <option value="nut">nut</option>
              <option value="washer">washer</option>
            </select>
          </label>
          <label className="block text-sm">
            <div className="text-xs font-semibold text-zinc-500">Size</div>
            <input
              name="size"
              defaultValue={size || ""}
              placeholder="M12"
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
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Spec</th>
              <th className="px-4 py-3">Pack</th>
              <th className="px-4 py-3">Cost (JPY/pack)</th>
              <th className="px-4 py-3">Lead</th>
              <th className="px-4 py-3">Avail</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {offers.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3">{o.supplier.name}</td>
                <td className="px-4 py-3">
                  <div className="font-mono text-xs">
                    {o.category ?? "—"} {o.size ?? ""} {o.lengthMm ?? ""} {o.strengthClass ?? ""} {o.finish ?? ""}
                  </div>
                </td>
                <td className="px-4 py-3">{o.packQty ?? "—"}</td>
                <td className="px-4 py-3">{o.unitCostJpy}</td>
                <td className="px-4 py-3">{o.leadTimeDays != null ? `${o.leadTimeDays}d` : "—"}</td>
                <td className="px-4 py-3">{o.availability}</td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {o.updatedAt.toISOString().slice(0, 19).replace("T", " ")}
                </td>
              </tr>
            ))}
            {offers.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-zinc-600 dark:text-zinc-300" colSpan={7}>
                  No offers.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

