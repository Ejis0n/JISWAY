import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { seoTitle } from "@/lib/seo/templates";
import { getCatalog } from "@/lib/catalog";
import { suggestSupplierIdForLines } from "@/lib/procurement/assignSupplier";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "requested", "confirmed", "received", "shipped", "closed", "canceled"] as const;

export default async function AdminProcurementTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = await prisma.procurementTask.findUnique({
    where: { id },
    include: {
      order: true,
      supplier: true,
      lines: { include: { variant: { include: { product: true } } } },
    },
  });
  if (!task) return notFound();

  const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" }, take: 500 });
  const assignments = await prisma.supplierAssignment.findMany();
  const suggestedSupplierId = task.supplierId
    ? null
    : suggestSupplierIdForLines({
        lines: task.lines.map((l) => ({ category: l.variant.product.category, size: l.variant.product.size })),
        assignments,
      });
  const suggestedSupplier = suggestedSupplierId
    ? suppliers.find((s) => s.id === suggestedSupplierId) ?? null
    : null;
  const catalog = getCatalog();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Procurement Task</h1>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Task <span className="font-mono text-xs">{task.id}</span> · Order{" "}
            <span className="font-mono text-xs">{task.orderId}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            className="rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
            href={`/admin/procurement/${task.id}/po.pdf`}
          >
            Download PO (PDF)
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
          <div className="font-semibold">Lines</div>
          <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800">
                <tr>
                  <th className="px-3 py-2">Variant</th>
                  <th className="px-3 py-2">Pack</th>
                  <th className="px-3 py-2">Qty (packs)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {task.lines.map((l) => {
                  const cat = catalog.find((v) => v.id === l.variant.slug) ?? null;
                  return (
                    <tr key={l.id}>
                      <td className="px-3 py-2">
                        <div className="font-medium">{cat ? seoTitle(cat) : l.variant.slug}</div>
                        <div className="mt-1 font-mono text-xs text-zinc-500">{l.variant.slug}</div>
                      </td>
                      <td className="px-3 py-2">{l.packQty}pcs</td>
                      <td className="px-3 py-2">{l.qtyPacks}</td>
                    </tr>
                  );
                })}
                {task.lines.length === 0 ? (
                  <tr>
                    <td className="px-3 py-4 text-sm text-zinc-600 dark:text-zinc-300" colSpan={3}>
                      No lines.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="font-semibold">Task status</div>
            <div className="mt-2 text-xs text-zinc-500">Timestamps are set automatically by status.</div>
            <form className="mt-3 flex items-center gap-2" action={`/api/admin/procurement/${task.id}/status`} method="post">
              <select
                name="status"
                defaultValue={task.status}
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
            <div className="font-semibold">Supplier</div>
            <div className="mt-2 text-sm">{task.supplier?.name ?? "—"}</div>
            {suggestedSupplier ? (
              <div className="mt-2 text-xs text-zinc-500">
                Suggested: <span className="font-medium">{suggestedSupplier.name}</span>
              </div>
            ) : null}
            <form
              className="mt-3 flex items-center gap-2"
              action={`/api/admin/procurement/${task.id}/assign-supplier`}
              method="post"
            >
              <select
                name="supplier_id"
                defaultValue={task.supplierId ?? suggestedSupplierId ?? ""}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <option value="">Unassigned</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button className="rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800">
                Set
              </button>
            </form>

            <form className="mt-3" action={`/api/admin/procurement/${task.id}/send-po`} method="post">
              <button className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
                Send supplier email (PO attached)
              </button>
              <div className="mt-2 text-xs text-zinc-500">
                Requires Supplier email + Resend configured.
              </div>
            </form>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="font-semibold">Evidence (photos URLs)</div>
            <div className="mt-2 text-xs text-zinc-500">Optional. Paste URLs (one per line). Stored for dispute handling.</div>
            <form className="mt-3 space-y-3" action={`/api/admin/procurement/${task.id}/evidence`} method="post">
              <label className="block text-sm">
                <div className="text-xs font-semibold text-zinc-500">Packaging photos</div>
                <textarea
                  name="packaging_photo_urls"
                  rows={4}
                  defaultValue={(task.packagingPhotoUrls ?? []).join("\n")}
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                />
              </label>
              <label className="block text-sm">
                <div className="text-xs font-semibold text-zinc-500">Shipment photos</div>
                <textarea
                  name="shipment_photo_urls"
                  rows={4}
                  defaultValue={(task.shipmentPhotoUrls ?? []).join("\n")}
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                />
              </label>
              <button className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800">
                Save evidence
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="font-semibold">Order</div>
            <div className="mt-2 space-y-1 text-sm">
              <div>
                <span className="text-zinc-500">Status:</span> {task.order.status} / {task.order.fulfillmentStatus}
              </div>
              <div>
                <span className="text-zinc-500">Email:</span> {task.order.email ?? "—"}
              </div>
              <div>
                <span className="text-zinc-500">Country:</span> {task.order.country ?? "—"}
              </div>
              <div>
                <span className="text-zinc-500">Total:</span> ${(task.order.totalUsd / 100).toFixed(2)}
              </div>
            </div>
            <div className="mt-3">
              <Link className="underline underline-offset-4" href="/admin/orders">
                View orders list
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="font-semibold">Shipping</div>
            <div className="mt-2 text-xs text-zinc-500">Creates a Shipment record and updates Order fields.</div>
            <form className="mt-3 space-y-3" action={`/api/admin/orders/${task.orderId}/ship`} method="post">
              <label className="block text-sm">
                <div className="text-xs font-semibold text-zinc-500">Carrier *</div>
                <input
                  name="carrier"
                  required
                  defaultValue={task.order.carrier ?? ""}
                  placeholder="DHL / FedEx / UPS ..."
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                />
              </label>
              <label className="block text-sm">
                <div className="text-xs font-semibold text-zinc-500">Tracking number *</div>
                <input
                  name="tracking_number"
                  required
                  defaultValue={task.order.trackingNumber ?? ""}
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                />
              </label>
              <button
                className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                disabled={task.order.status !== "paid"}
              >
                Mark shipped
              </button>
              <div className="text-xs text-zinc-500">
                Disabled unless Order status is <span className="font-mono">paid</span>.
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

