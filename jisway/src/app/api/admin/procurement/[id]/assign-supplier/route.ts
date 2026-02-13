import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdminToken } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminToken(req);
    const { id } = await ctx.params;
    const form = await req.formData();
    const supplierIdRaw = String(form.get("supplier_id") ?? "").trim();
    const supplierId = supplierIdRaw || null;

    await prisma.procurementTask.update({
      where: { id },
      data: { supplierId },
    });

    return NextResponse.redirect(new URL(`/admin/procurement/${id}`, req.url), 303);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

