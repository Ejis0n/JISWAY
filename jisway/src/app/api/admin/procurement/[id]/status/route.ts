import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdminToken } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const STATUSES = ["new", "requested", "confirmed", "received", "shipped", "closed", "canceled"] as const;

function isStatus(x: string): x is (typeof STATUSES)[number] {
  return (STATUSES as readonly string[]).includes(x);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminToken(req);
    const { id } = await ctx.params;
    const form = await req.formData();
    const statusRaw = String(form.get("status") ?? "").trim();
    if (!isStatus(statusRaw)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    const now = new Date();
    const stamp: Record<string, Date> = {};
    if (statusRaw === "requested") stamp.requestedAt = now;
    if (statusRaw === "confirmed") stamp.confirmedAt = now;
    if (statusRaw === "received") stamp.receivedAt = now;
    if (statusRaw === "shipped") stamp.shippedAt = now;
    if (statusRaw === "closed") stamp.closedAt = now;

    await prisma.procurementTask.update({
      where: { id },
      data: { status: statusRaw, ...stamp },
    });

    // Also update order fulfillmentStatus (coarse mapping)
    const fulfillment =
      statusRaw === "new" || statusRaw === "requested" || statusRaw === "confirmed"
        ? "in_procurement"
        : statusRaw === "received"
          ? "ready_to_ship"
          : statusRaw === "shipped"
            ? "shipped"
            : statusRaw === "closed"
              ? "completed"
              : statusRaw === "canceled"
                ? "canceled"
                : "pending_procurement";

    const task = await prisma.procurementTask.findUnique({ where: { id }, select: { orderId: true } });
    if (task) {
      await prisma.order.update({
        where: { id: task.orderId },
        data: { fulfillmentStatus: fulfillment as never },
      });
    }

    return NextResponse.redirect(new URL(`/admin/procurement/${id}`, req.url), 303);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

