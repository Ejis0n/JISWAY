import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminToken } from "@/lib/admin";

const BodySchema = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "COMPLETED", "REJECTED"]),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const token = await requireAdminToken(req);
    const { id } = await ctx.params;
    const form = await req.formData();
    const parsed = BodySchema.safeParse({ status: form.get("status") });
    if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    await prisma.procurementRequest.update({
      where: { id },
      data: { status: parsed.data.status },
    });

    await prisma.auditLog.create({
      data: {
        adminUserId: String(token.sub),
        action: "set_procure_status",
        entityType: "ProcurementRequest",
        entityId: id,
        meta: { status: parsed.data.status },
      },
    });

    return NextResponse.redirect(new URL("/admin/procure", req.url));
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // eslint-disable-next-line no-console
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

