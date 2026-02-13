import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminToken } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
  category: z.enum(["bolt", "nut", "washer"]),
  size: z.string().optional(),
  priority: z.coerce.number().int().min(-1000).max(1000).optional(),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminToken(req);
    const { id } = await ctx.params;
    const form = await req.formData();

    const parsed = BodySchema.safeParse({
      category: form.get("category"),
      size: String(form.get("size") ?? "").trim() || undefined,
      priority: form.get("priority"),
    });
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const size = parsed.data.size ? parsed.data.size.toUpperCase() : "";
    if (size && !/^M\d+$/.test(size)) return NextResponse.json({ error: "Invalid size" }, { status: 400 });

    const existing = await prisma.supplierAssignment.findFirst({
      where: { supplierId: id, category: parsed.data.category, size },
      select: { id: true },
    });
    if (existing) {
      await prisma.supplierAssignment.update({
        where: { id: existing.id },
        data: { priority: parsed.data.priority ?? 0 },
      });
    } else {
      await prisma.supplierAssignment.create({
        data: {
          supplierId: id,
          category: parsed.data.category,
          size,
          priority: parsed.data.priority ?? 0,
        },
      });
    }

    return NextResponse.redirect(new URL(`/admin/suppliers/${id}`, req.url), 303);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

