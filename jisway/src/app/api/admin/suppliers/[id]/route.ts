import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdminToken } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminToken(req);
    const { id } = await ctx.params;
    const form = await req.formData();
    const name = String(form.get("name") ?? "").trim();
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

    const email = String(form.get("email") ?? "").trim() || null;
    const phone = String(form.get("phone") ?? "").trim() || null;
    const address = String(form.get("address") ?? "").trim() || null;
    const leadTimeDaysRaw = String(form.get("lead_time_days") ?? "").trim();
    const leadTimeDays = leadTimeDaysRaw ? Number(leadTimeDaysRaw) : null;
    const notes = String(form.get("notes") ?? "").trim() || null;

    await prisma.supplier.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        address,
        leadTimeDays: Number.isFinite(leadTimeDays as number) ? (leadTimeDays as number) : null,
        notes,
      },
    });

    return NextResponse.redirect(new URL(`/admin/suppliers/${id}`, req.url), 303);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

