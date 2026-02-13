import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdminToken } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { matchSupplierOffers, lineSpecFromVariant } from "@/lib/procurement/match";
import { routeProcurement } from "@/lib/procurement/router";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminToken(req);
    const { id } = await ctx.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { variant: { include: { product: true } } } } },
    });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (order.status !== "paid") return NextResponse.json({ error: "Order is not paid" }, { status: 400 });

    const cfg =
      (await prisma.routingConfig.findUnique({ where: { id: "default" } })) ??
      (await prisma.routingConfig.create({ data: { id: "default", enabled: false, strategy: "BALANCED" } }));
    if (!cfg.enabled) return NextResponse.json({ error: "Routing is disabled" }, { status: 400 });

    // Clear previous routing artifacts for this order (v1 overwrite)
    await prisma.routingDecision.deleteMany({ where: { orderId: order.id } });
    await prisma.procurementTask.deleteMany({ where: { orderId: order.id } });

    const allOffers = await prisma.supplierOffer.findMany();
    const weights = (cfg.weights as any) ?? { cost: 0.5, lead: 0.3, availability: 0.2, match: 0.1 };

    const lines = order.items.map((it) => {
      const pack_qty =
        it.variant.packType === "PACK_10"
          ? 10
          : it.variant.packType === "PACK_20"
            ? 20
            : it.variant.packType === "PACK_50"
              ? 50
              : 100;
      const spec = lineSpecFromVariant({ variant: it.variant, pack_qty });
      const candidates = matchSupplierOffers({ line: spec, offers: allOffers });
      return { lineId: it.id, spec, qty_packs: it.quantity, candidates };
    });

    const routed = routeProcurement({ lines, strategy: cfg.strategy, weights });

    await prisma.routingDecision.createMany({
      data: routed.decisions.map((d) => ({
        orderId: order.id,
        variantId: d.variantId,
        chosenSupplierId: d.chosen_supplier_id,
        strategy: cfg.strategy,
        scoreJson: d.score_json as any,
        reasonText: d.reason_text,
      })),
    });

    for (const group of routed.bySupplier) {
      await prisma.procurementTask.create({
        data: {
          orderId: order.id,
          status: "new",
          supplierId: group.supplierId,
          lines: {
            create: group.lines.map((l) => ({
              variantId: l.variantId,
              qtyPacks: l.qty_packs,
              packQty: lines.find((x) => x.lineId === l.lineId)!.spec.pack_qty,
              expectedCostJpy:
                (routed.decisions
                  .find((d) => d.lineId === l.lineId)!
                  .score_json.candidates.find((c) => c.offer_id === l.offer_id)!.estimated_cost_jpy) ?? null,
            })),
          },
        },
      });
    }

    if (routed.needsAssignment.length) {
      await prisma.procurementTask.create({
        data: {
          orderId: order.id,
          status: "needs_assignment",
          supplierId: null,
          lines: {
            create: routed.needsAssignment.map((l) => ({
              variantId: l.variantId,
              qtyPacks: l.qty_packs,
              packQty: lines.find((x) => x.lineId === l.lineId)!.spec.pack_qty,
            })),
          },
        },
      });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { fulfillmentStatus: "pending_procurement" },
    });

    return NextResponse.redirect(new URL(`/admin/orders/${order.id}`, req.url), 303);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // eslint-disable-next-line no-console
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

