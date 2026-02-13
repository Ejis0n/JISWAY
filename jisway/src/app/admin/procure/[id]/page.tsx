import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminProcureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const r = await prisma.procurementRequest.findUnique({ where: { id } });
  if (!r) return notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Procurement {r.id}</h1>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{r.email}</div>
        </div>
        <Link className="text-sm underline underline-offset-4" href="/admin/procure">
          Back
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-xs font-semibold text-zinc-500">Status</div>
          <div className="mt-1 font-medium">{r.status}</div>
          <div className="mt-4 text-xs font-semibold text-zinc-500">Name</div>
          <div className="mt-1">{r.name}</div>
          <div className="mt-4 text-xs font-semibold text-zinc-500">Company</div>
          <div className="mt-1">{r.company}</div>
          <div className="mt-4 text-xs font-semibold text-zinc-500">Country</div>
          <div className="mt-1">{r.country}</div>
          {r.quantity ? (
            <>
              <div className="mt-4 text-xs font-semibold text-zinc-500">Quantity (packs)</div>
              <div className="mt-1">{r.quantity}</div>
            </>
          ) : null}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="font-semibold">Spec</div>
          <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-zinc-200 bg-white p-4 text-xs dark:border-zinc-800 dark:bg-zinc-950">
            {r.specText}
          </pre>
          {r.notes ? (
            <>
              <div className="mt-4 font-semibold">Notes</div>
              <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-zinc-200 bg-white p-4 text-xs dark:border-zinc-800 dark:bg-zinc-950">
                {r.notes}
              </pre>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

