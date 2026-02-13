import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminToken } from "@/lib/admin";

const BodySchema = z.object({
  carrier: z.string().min(1).max(100),
  trackingNumber: z.string().min(1).max(200),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const token = await requireAdminToken(req);
    const { id } = await ctx.params;
    const form = await req.formData();

    const parsed = BodySchema.safeParse({
      carrier: String(form.get("carrier") ?? "").trim(),
      trackingNumber: String(form.get("tracking_number") ?? "").trim(),
    });
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const now = new Date();
    const order = await prisma.order.update({
      where: { id },
      data: {
        carrier: parsed.data.carrier,
        trackingNumber: parsed.data.trackingNumber,
        shippedAt: now,
        fulfillmentStatus: "shipped",
        shipments: {
          create: {
            carrier: parsed.data.carrier,
            trackingNumber: parsed.data.trackingNumber,
            shippedAt: now,
          },
        },
      },
    });

    // Keep OrderShipping in sync (v1 shipping snapshot + evidence)
    await prisma.orderShipping.updateMany({
      where: { orderId: id },
      data: { trackingNumber: parsed.data.trackingNumber, shippedAt: now },
    });

    await prisma.orderEvidence.create({
      data: {
        orderId: id,
        type: "tracking",
        textContent: [
          "Shipping tracking",
          `carrier: ${parsed.data.carrier}`,
          `tracking_number: ${parsed.data.trackingNumber}`,
          `shipped_at: ${now.toISOString()}`,
        ].join("\n"),
      },
    });

    // Advance procurement tasks for the order
    const tasks = await prisma.procurementTask.findMany({ where: { orderId: id } });
    const toUpdate = tasks.filter((t) => !["shipped", "closed", "canceled"].includes(t.status));
    if (toUpdate.length) {
      await prisma.procurementTask.updateMany({
        where: { orderId: id, status: { notIn: ["shipped", "closed", "canceled"] } },
        data: { status: "shipped", shippedAt: now },
      });
    }

    await prisma.auditLog.create({
      data: {
        adminUserId: String(token.sub),
        action: "ship_order",
        entityType: "Order",
        entityId: id,
        meta: { carrier: order.carrier, trackingNumber: order.trackingNumber },
      },
    });

    return NextResponse.redirect(new URL(`/admin/orders/${id}`, req.url), 303);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // eslint-disable-next-line no-console
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

