import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminToken } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const RuleUpsertSchema = z.object({
  zone_id: z.string().min(1),
  band: z.enum(["BAND_A_10PCS", "BAND_B_20PCS", "BAND_C_BULK"]),
  carrier: z.enum(["JP_POST", "DHL"]),
  price_usd: z.number().positive(),
  eta_min_days: z.number().int().positive(),
  eta_max_days: z.number().int().positive(),
  tracking_included: z.boolean().optional().default(true),
  notes: z.string().max(500).optional(),
});

function usdToCents(n: number) {
  return Math.round(n * 100);
}

export async function GET(req: NextRequest) {
  try {
    await requireAdminToken(req);
    const rules = await prisma.shippingRule.findMany({
      include: { zone: { select: { name: true } } },
      orderBy: [{ updatedAt: "desc" }],
      take: 2000,
    });
    return NextResponse.json({ rules });
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
    const parsed = RuleUpsertSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const data = parsed.data;
    const rule = await prisma.shippingRule.upsert({
      where: { zoneId_band_carrier: { zoneId: data.zone_id, band: data.band, carrier: data.carrier } },
      create: {
        zoneId: data.zone_id,
        band: data.band,
        carrier: data.carrier,
        priceUsdCents: usdToCents(data.price_usd),
        etaMinDays: data.eta_min_days,
        etaMaxDays: data.eta_max_days,
        trackingIncluded: data.tracking_included,
        notes: data.notes,
      },
      update: {
        priceUsdCents: usdToCents(data.price_usd),
        etaMinDays: data.eta_min_days,
        etaMaxDays: data.eta_max_days,
        trackingIncluded: data.tracking_included,
        notes: data.notes,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminUserId: String(token.sub),
        action: "upsert_shipping_rule",
        entityType: "ShippingRule",
        entityId: rule.id,
        meta: data,
      },
    });

    return NextResponse.json({ ok: true, rule });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // eslint-disable-next-line no-console
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

