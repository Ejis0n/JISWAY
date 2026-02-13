import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminToken } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const ZoneCreateSchema = z.object({
  name: z.string().min(1).max(64),
  is_active: z.boolean().optional().default(true),
  countries: z.array(z.string().min(2).max(2)).optional().default([]),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdminToken(req);
    const zones = await prisma.shippingZone.findMany({
      include: { countries: true, policy: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ zones });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // eslint-disable-next-line no-console
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await requireAdminToken(req);
    const json = (await req.json().catch(() => null)) as unknown;
    const parsed = ZoneCreateSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const zone = await prisma.shippingZone.create({
      data: {
        name: parsed.data.name,
        isActive: parsed.data.is_active,
        countries: {
          create: parsed.data.countries.map((c) => ({ code: c.toUpperCase() })),
        },
      },
      include: { countries: true },
    });

    await prisma.auditLog.create({
      data: {
        adminUserId: String(token.sub),
        action: "create_shipping_zone",
        entityType: "ShippingZone",
        entityId: zone.id,
        meta: { name: zone.name, countries: zone.countries.map((c) => c.code) },
      },
    });

    return NextResponse.json({ ok: true, zone });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // eslint-disable-next-line no-console
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

