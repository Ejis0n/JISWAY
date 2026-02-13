import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cfg =
    (await prisma.routingConfig.findUnique({ where: { id: "default" } })) ??
    (await prisma.routingConfig.create({ data: { id: "default", enabled: false, strategy: "BALANCED" } }));
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { variant: { include: { product: true } } } },
      shipments: { orderBy: { createdAt: "desc" } },
      procurementTasks: { orderBy: { createdAt: "desc" } },
      routingDecisions: { orderBy: { decidedAt: "desc" }, take: 50, include: { chosenSupplier: true } },
      orderShipping: true,
    },
  });
  if (!order) return notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Order</h1>
        <div className="mt-1 font-mono text-xs text-zinc-500">{order.id}</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
          <div className="font-semibold">Items</div>
          <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800">
                <tr>
                  <th className="px-3 py-2">Variant</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2">Unit</th>
                  <th className="px-3 py-2">Line</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {order.items.map((it) => (
                  <tr key={it.id}>
                    <td className="px-3 py-2">
                      <div className="font-mono text-xs">{it.variant.slug}</div>
                    </td>
                    <td className="px-3 py-2">{it.quantity}</td>
                    <td className="px-3 py-2">${(it.unitPriceUsd / 100).toFixed(2)}</td>
                    <td className="px-3 py-2">${(it.lineTotalUsd / 100).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="font-semibold">Summary</div>
            <div className="mt-2 space-y-1">
              <div>
                <span className="text-zinc-500">Email:</span> {order.email ?? "—"}
              </div>
              <div>
                <span className="text-zinc-500">Country:</span> {order.country ?? "—"}
              </div>
              <div>
                <span className="text-zinc-500">Status:</span> {order.status} / {order.fulfillmentStatus}
              </div>
              <div>
                <span className="text-zinc-500">Dispute:</span> {order.disputeStatus}
              </div>
              <div>
                <span className="text-zinc-500">Total:</span> ${(order.totalUsd / 100).toFixed(2)}
              </div>
            </div>
            <div className="mt-4">
              <a
                className="block w-full rounded-md border border-zinc-200 px-3 py-2 text-center text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                href={`/api/admin/orders/${order.id}/stripe-evidence.pdf`}
              >
                Generate Stripe Evidence (PDF)
              </a>
              <div className="mt-2 text-xs text-zinc-500">
                Download a bundle for manual Stripe dispute submission.
              </div>
            </div>
            {order.procurementTasks.length ? (
              <div className="mt-3 space-y-1">
                <div className="text-xs font-semibold text-zinc-500">Procurement tasks</div>
                {order.procurementTasks.slice(0, 5).map((t) => (
                  <Link
                    key={t.id}
                    className="block underline underline-offset-4"
                    href={`/admin/procurement/${t.id}`}
                  >
                    {t.id} · {t.status} · {t.supplierId ?? "unassigned"}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold">Routing</div>
              <div className="text-xs text-zinc-500">
                enabled: <span className="font-mono">{String(cfg.enabled)}</span> · strategy:{" "}
                <span className="font-mono">{cfg.strategy}</span>
              </div>
            </div>
            <form className="mt-3" action={`/api/admin/orders/${order.id}/route`} method="post">
              <button
                className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                disabled={!cfg.enabled || order.status !== "paid"}
              >
                Run routing (overwrite tasks)
              </button>
            </form>
            <div className="mt-3 space-y-2">
              {order.routingDecisions.map((d) => (
                <div key={d.id} className="rounded-md border border-zinc-200 p-3 text-xs dark:border-zinc-800">
                  <div className="font-mono">{d.variantId}</div>
                  <div className="mt-1 text-zinc-600 dark:text-zinc-300">
                    chosen: {d.chosenSupplier?.name ?? "needs_manual_assignment"} · {d.strategy}
                  </div>
                  <div className="mt-1">{d.reasonText}</div>
                </div>
              ))}
              {order.routingDecisions.length === 0 ? (
                <div className="text-sm text-zinc-600 dark:text-zinc-300">No routing decisions.</div>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="font-semibold">Shipping</div>
            <div className="mt-2 text-xs text-zinc-500">Creates a Shipment record and updates Order fields.</div>
            <form className="mt-3 space-y-3" action={`/api/admin/orders/${order.id}/ship`} method="post">
              <label className="block text-sm">
                <div className="text-xs font-semibold text-zinc-500">Carrier *</div>
                <input
                  name="carrier"
                  required
                  defaultValue={order.carrier ?? ""}
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                />
              </label>
              <label className="block text-sm">
                <div className="text-xs font-semibold text-zinc-500">Tracking number *</div>
                <input
                  name="tracking_number"
                  required
                  defaultValue={order.trackingNumber ?? ""}
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                />
              </label>
              <button
                className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                disabled={order.status !== "paid"}
              >
                Mark shipped
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="font-semibold">Evidence (photos URLs)</div>
            <div className="mt-2 text-xs text-zinc-500">Optional. Paste URLs (one per line). Stored for dispute handling.</div>
            <form className="mt-3 space-y-3" action={`/api/admin/orders/${order.id}/evidence`} method="post">
              <label className="block text-sm">
                <div className="text-xs font-semibold text-zinc-500">Packaging photos</div>
                <textarea
                  name="packaging_photo_urls"
                  rows={4}
                  defaultValue={(order.orderShipping?.packagingPhotoUrls ?? []).join("\n")}
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                />
              </label>
              <label className="block text-sm">
                <div className="text-xs font-semibold text-zinc-500">Shipment photos</div>
                <textarea
                  name="shipment_photo_urls"
                  rows={4}
                  defaultValue={(order.orderShipping?.shipmentPhotoUrls ?? []).join("\n")}
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                />
              </label>
              <button className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800">
                Save evidence
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="font-semibold">Shipments</div>
            <div className="mt-2 space-y-2 text-sm">
              {order.shipments.map((s) => (
                <div key={s.id} className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
                  <div>
                    <span className="text-zinc-500">Carrier:</span> {s.carrier ?? "—"}
                  </div>
                  <div>
                    <span className="text-zinc-500">Tracking:</span> {s.trackingNumber ?? "—"}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {s.shippedAt ? s.shippedAt.toISOString().slice(0, 19).replace("T", " ") : "—"}
                  </div>
                </div>
              ))}
              {order.shipments.length === 0 ? <div className="text-zinc-600 dark:text-zinc-300">None.</div> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

