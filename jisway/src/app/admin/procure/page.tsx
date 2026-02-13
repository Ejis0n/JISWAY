import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminProcurePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim();
  const status =
    sp.status && ["NEW", "IN_PROGRESS", "COMPLETED", "REJECTED"].includes(sp.status)
      ? sp.status
      : undefined;

  const requests = await prisma.procurementRequest.findMany({
    where: {
      ...(status ? { status: status as "NEW" | "IN_PROGRESS" | "COMPLETED" | "REJECTED" } : {}),
      ...(q
        ? {
            OR: [
              { id: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { company: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Procurement Requests</h1>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">B2B inbound capture.</div>
        </div>
        <form className="flex flex-wrap items-center gap-2" method="get">
          <label className="text-sm">
            <span className="sr-only">Search</span>
            <input
              name="q"
              defaultValue={q || ""}
              placeholder="Search (id, email, company)"
              className="w-64 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
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
              <option value="NEW">NEW</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="REJECTED">REJECTED</option>
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
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {requests.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {r.createdAt.toISOString().slice(0, 19).replace("T", " ")}
                </td>
                <td className="px-4 py-3">{r.email}</td>
                <td className="px-4 py-3">{r.company}</td>
                <td className="px-4 py-3">{r.country}</td>
                <td className="px-4 py-3">
                  <form action={`/api/admin/procure/${r.id}/status`} method="post">
                    <select
                      name="status"
                      defaultValue={r.status}
                      className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <option value="NEW">NEW</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                    <button className="ml-2 text-xs underline underline-offset-4">Save</button>
                  </form>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link className="underline underline-offset-4" href={`/admin/procure/${r.id}`}>
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {requests.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-zinc-600 dark:text-zinc-300" colSpan={6}>
                  No requests.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

