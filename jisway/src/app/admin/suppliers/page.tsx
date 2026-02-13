import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminSuppliersPage() {
  const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" }, take: 500 });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Suppliers</h1>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Manage supplier contacts and lead times.</div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-sm font-semibold">Add supplier</div>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" action="/api/admin/suppliers" method="post">
          <label className="block text-sm sm:col-span-2">
            <div className="text-xs font-semibold text-zinc-500">Name *</div>
            <input
              name="name"
              required
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <div className="text-xs font-semibold text-zinc-500">Email</div>
            <input
              name="email"
              type="email"
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <div className="text-xs font-semibold text-zinc-500">Phone</div>
            <input
              name="phone"
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <div className="text-xs font-semibold text-zinc-500">Address</div>
            <input
              name="address"
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <div className="text-xs font-semibold text-zinc-500">Lead time (days)</div>
            <input
              name="lead_time_days"
              type="number"
              min={0}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <div className="text-xs font-semibold text-zinc-500">Notes</div>
            <textarea
              name="notes"
              rows={3}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <div className="sm:col-span-2">
            <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
              Create
            </button>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Lead time</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {suppliers.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3">{s.name}</td>
                <td className="px-4 py-3">{s.email ?? "—"}</td>
                <td className="px-4 py-3">{s.leadTimeDays != null ? `${s.leadTimeDays}d` : "—"}</td>
                <td className="px-4 py-3 text-right">
                  <Link className="underline underline-offset-4" href={`/admin/suppliers/${s.id}`}>
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {suppliers.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-zinc-600 dark:text-zinc-300" colSpan={4}>
                  No suppliers.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

