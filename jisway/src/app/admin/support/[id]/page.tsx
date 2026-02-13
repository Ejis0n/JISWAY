import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "in_progress", "waiting_customer", "resolved", "rejected"] as const;

export default async function AdminSupportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await prisma.supportTicket.findUnique({
    where: { id },
    include: { attachments: { orderBy: { createdAt: "desc" } } },
  });
  if (!t) return notFound();

  const replyTemplate = [
    "Hello,",
    "",
    "Thanks for contacting JISWAY support.",
    "",
    "To help us resolve this quickly, please reply with:",
    "- Order ID",
    "- Photos of outer packaging and the item (for damage claims)",
    "- Any tracking details you have",
    "",
    "We will review and respond with next steps.",
    "",
    "— JISWAY",
  ].join("\n");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Support Ticket</h1>
          <div className="mt-1 font-mono text-xs text-zinc-500">{t.id}</div>
        </div>
        <Link className="text-sm underline underline-offset-4" href="/admin/support">
          Back to list
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
          <div className="font-semibold">Customer message</div>
          <div className="mt-2 space-y-1 text-sm">
            <div>
              <span className="text-zinc-500">Email:</span> {t.email}
            </div>
            <div>
              <span className="text-zinc-500">Country:</span> {t.country ?? "—"}
            </div>
            <div>
              <span className="text-zinc-500">Order:</span> {t.orderId ?? "—"}
            </div>
            <div>
              <span className="text-zinc-500">Category:</span> {t.category}
            </div>
            <div>
              <span className="text-zinc-500">Status:</span> {t.status}
            </div>
            <div className="text-xs text-zinc-500">
              Created: {t.createdAt.toISOString().slice(0, 19).replace("T", " ")} · Updated:{" "}
              {t.updatedAt.toISOString().slice(0, 19).replace("T", " ")}
            </div>
          </div>
          <pre className="mt-4 whitespace-pre-wrap rounded-lg border border-zinc-200 bg-white p-4 text-xs dark:border-zinc-800 dark:bg-zinc-950">
            {t.message}
          </pre>

          <div className="mt-4">
            <div className="text-xs font-semibold text-zinc-500">Attachments</div>
            <div className="mt-2 space-y-2 text-sm">
              {t.attachments.map((a) => (
                <div key={a.id} className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
                  <div className="text-xs text-zinc-500">{a.kind}</div>
                  <a className="break-all underline underline-offset-4" href={a.fileUrl} target="_blank" rel="noreferrer">
                    {a.fileUrl}
                  </a>
                </div>
              ))}
              {t.attachments.length === 0 ? <div className="text-zinc-600 dark:text-zinc-300">None.</div> : null}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="font-semibold">Update status</div>
            <form className="mt-3 flex items-center gap-2" action={`/api/admin/support/${t.id}/update`} method="post">
              <select
                name="status"
                defaultValue={t.status}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
                Save
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="font-semibold">Internal notes</div>
            <form className="mt-3 space-y-2" action={`/api/admin/support/${t.id}/update`} method="post">
              <input type="hidden" name="status" value={t.status} />
              <textarea
                name="internal_notes"
                defaultValue={t.internalNotes ?? ""}
                rows={8}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                placeholder="Internal notes (not visible to customer)"
              />
              <button className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800">
                Save notes
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="font-semibold">Reply (optional)</div>
            <div className="mt-2 text-xs text-zinc-500">Email sending is optional. Copy template below.</div>
            <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-zinc-200 bg-white p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950">
              {replyTemplate}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

