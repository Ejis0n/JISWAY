import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminToken } from "@/lib/admin";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const token = await requireAdminToken(req);
    const { id } = await ctx.params;

    const inv = await prisma.invoice.update({
      where: { id },
      data: { status: "paid", paidAt: new Date() },
      include: { quoteRequests: true },
    });

    for (const q of inv.quoteRequests) {
      await prisma.quoteRequest.update({
        where: { id: q.id },
        data: { status: "COMPLETED" },
      });
    }

    await prisma.auditLog.create({
      data: {
        adminUserId: String(token.sub),
        action: "mark_invoice_paid",
        entityType: "Invoice",
        entityId: id,
        meta: { invoiceToken: inv.token },
      },
    });

    return NextResponse.redirect(new URL(`/invoice/${inv.token}`, req.url));
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // eslint-disable-next-line no-console
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

