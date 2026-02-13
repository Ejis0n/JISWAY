import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdminToken } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

function parseUrls(text: string) {
  return text
    .split(/\n|,/g)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const token = await requireAdminToken(req);
    const { id } = await ctx.params;
    const form = await req.formData();
    const packaging = parseUrls(String(form.get("packaging_photo_urls") || ""));
    const shipment = parseUrls(String(form.get("shipment_photo_urls") || ""));

    const order = await prisma.order.findUnique({ where: { id }, include: { orderShipping: true } });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!order.orderShipping) return NextResponse.json({ error: "OrderShipping not found" }, { status: 400 });

    await prisma.orderShipping.update({
      where: { orderId: order.id },
      data: { packagingPhotoUrls: packaging, shipmentPhotoUrls: shipment },
    });

    await prisma.auditLog.create({
      data: {
        adminUserId: String(token.sub),
        action: "update_order_shipping_evidence",
        entityType: "OrderShipping",
        entityId: order.orderShipping.id,
        meta: { packagingCount: packaging.length, shipmentCount: shipment.length },
      },
    });

    return NextResponse.redirect(new URL(`/admin/orders/${order.id}`, req.url), 303);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // eslint-disable-next-line no-console
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

