import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminToken } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const ZoneUpdateSchema = z.object({
  name: z.string().min(1).max(64),
  is_active: z.boolean(),
  countries: z.array(z.string().min(2).max(2)).optional().default([]),
});

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const token = await requireAdminToken(req);
    const { id } = await ctx.params;
    const json = (await req.json().catch(() => null)) as unknown;
    const parsed = ZoneUpdateSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const zone = await prisma.shippingZone.update({
      where: { id },
      data: { name: parsed.data.name, isActive: parsed.data.is_active },
    });
    await prisma.shippingZoneCountry.deleteMany({ where: { zoneId: id } });
    if (parsed.data.countries.length > 0) {
      await prisma.shippingZoneCountry.createMany({
        data: parsed.data.countries.map((c) => ({ zoneId: id, code: c.toUpperCase() })),
        skipDuplicates: true,
      });
    }

    await prisma.auditLog.create({
      data: {
        adminUserId: String(token.sub),
        action: "update_shipping_zone",
        entityType: "ShippingZone",
        entityId: id,
        meta: { name: zone.name, isActive: zone.isActive, countries: parsed.data.countries },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // eslint-disable-next-line no-console
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

