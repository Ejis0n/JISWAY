import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdminToken } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const STATUSES = ["new", "in_progress", "waiting_customer", "resolved", "rejected"] as const;

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const token = await requireAdminToken(req);
    const { id } = await ctx.params;
    const form = await req.formData();
    const status = String(form.get("status") || "");
    const internalNotes = String(form.get("internal_notes") || "");

    const data: any = {};
    if (STATUSES.includes(status as any)) data.status = status;
    if (form.has("internal_notes")) data.internalNotes = internalNotes || null;

    await prisma.supportTicket.update({ where: { id }, data });

    await prisma.auditLog.create({
      data: {
        adminUserId: String(token.sub),
        action: "update_support_ticket",
        entityType: "SupportTicket",
        entityId: id,
        meta: { status: data.status, internalNotes: data.internalNotes ? "set" : "unset" },
      },
    });

    return NextResponse.redirect(new URL(`/admin/support/${id}`, req.url), 303);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // eslint-disable-next-line no-console
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

