import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdminToken } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; assignmentId: string }> },
) {
  try {
    await requireAdminToken(req);
    const { id, assignmentId } = await ctx.params;

    await prisma.supplierAssignment.delete({
      where: { id: assignmentId },
    });

    return NextResponse.redirect(new URL(`/admin/suppliers/${id}`, req.url), 303);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

