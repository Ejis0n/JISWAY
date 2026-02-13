import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminSupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: { assignments: { orderBy: [{ category: "asc" }, { size: "asc" }] } },
  });
  if (!supplier) return notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Supplier</h1>
        <div className="mt-1 font-mono text-xs text-zinc-500">{supplier.id}</div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <form className="grid gap-3 sm:grid-cols-2" action={`/api/admin/suppliers/${supplier.id}`} method="post">
          <label className="block text-sm sm:col-span-2">
            <div className="text-xs font-semibold text-zinc-500">Name *</div>
            <input
              name="name"
              required
              defaultValue={supplier.name}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <div className="text-xs font-semibold text-zinc-500">Email</div>
            <input
              name="email"
              type="email"
              defaultValue={supplier.email ?? ""}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <div className="text-xs font-semibold text-zinc-500">Phone</div>
            <input
              name="phone"
              defaultValue={supplier.phone ?? ""}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <div className="text-xs font-semibold text-zinc-500">Address</div>
            <input
              name="address"
              defaultValue={supplier.address ?? ""}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <div className="text-xs font-semibold text-zinc-500">Lead time (days)</div>
            <input
              name="lead_time_days"
              type="number"
              min={0}
              defaultValue={supplier.leadTimeDays ?? ""}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <div className="text-xs font-semibold text-zinc-500">Notes</div>
            <textarea
              name="notes"
              rows={4}
              defaultValue={supplier.notes ?? ""}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <div className="sm:col-span-2">
            <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
              Save
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-sm font-semibold">Assignments</div>
        <div className="mt-1 text-xs text-zinc-500">Category-wide (size empty) or size-specific (e.g. M12).</div>

        <form
          className="mt-4 grid gap-3 sm:grid-cols-4"
          action={`/api/admin/suppliers/${supplier.id}/assignments/add`}
          method="post"
        >
          <label className="block text-sm">
            <div className="text-xs font-semibold text-zinc-500">Category *</div>
            <select
              name="category"
              required
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="bolt">bolt</option>
              <option value="nut">nut</option>
              <option value="washer">washer</option>
            </select>
          </label>
          <label className="block text-sm">
            <div className="text-xs font-semibold text-zinc-500">Size (optional)</div>
            <input
              name="size"
              placeholder="M12"
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <div className="text-xs font-semibold text-zinc-500">Priority</div>
            <input
              name="priority"
              type="number"
              defaultValue={0}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <div className="flex items-end">
            <button className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
              Add
            </button>
          </div>
        </form>

        <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800">
              <tr>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Size</th>
                <th className="px-3 py-2">Priority</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {supplier.assignments.map((a) => (
                <tr key={a.id}>
                  <td className="px-3 py-2">{a.category}</td>
                  <td className="px-3 py-2">{a.size === "" ? "—" : a.size}</td>
                  <td className="px-3 py-2">{a.priority}</td>
                  <td className="px-3 py-2 text-right">
                    <form action={`/api/admin/suppliers/${supplier.id}/assignments/${a.id}/delete`} method="post">
                      <button className="text-xs underline underline-offset-4">Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
              {supplier.assignments.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-sm text-zinc-600 dark:text-zinc-300" colSpan={4}>
                    No assignments.
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

