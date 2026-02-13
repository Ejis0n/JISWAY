import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdminToken } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { renderPoPdfBuffer } from "@/lib/pdf/po";
import { supplierPoEmail } from "@/lib/email/templates/supplier_po";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminToken(req);
    const { id } = await ctx.params;

    const task = await prisma.procurementTask.findUnique({
      where: { id },
      include: {
        order: true,
        supplier: true,
        lines: { include: { variant: { include: { product: true } } } },
      },
    });
    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!task.supplier || !task.supplier.email)
      return NextResponse.json({ error: "Supplier email missing" }, { status: 400 });

    const pdf = await renderPoPdfBuffer(task);
    const email = supplierPoEmail(task);

    await sendEmail({
      to: task.supplier.email,
      subject: email.subject,
      text: email.text,
      attachments: [{ filename: `po-${task.id}.pdf`, content: pdf, contentType: "application/pdf" }],
    });

    // move status forward if still new
    if (task.status === "new") {
      await prisma.procurementTask.update({
        where: { id: task.id },
        data: { status: "requested", requestedAt: new Date() },
      });
      await prisma.order.update({
        where: { id: task.orderId },
        data: { fulfillmentStatus: "in_procurement" },
      });
    }

    return NextResponse.redirect(new URL(`/admin/procurement/${id}`, req.url), 303);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

