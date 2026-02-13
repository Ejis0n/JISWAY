import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminToken } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const UpsertSchema = z.object({
  zone_id: z.string().min(1),
  policy: z.enum(["DEFAULT", "CHEAPEST", "FASTEST"]).optional(),
  default_carrier: z.enum(["JP_POST", "DHL"]).optional(),
  force_dhl_over_weight_kg: z.number().positive().nullable().optional(),
  force_dhl_over_subtotal_usd: z.number().positive().nullable().optional(),
});

function usdToCents(n: number) {
  return Math.round(n * 100);
}

export async function GET(req: NextRequest) {
  try {
    await requireAdminToken(req);
    const policies = await prisma.carrierPolicy.findMany({
      include: { zone: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ policies });
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
    const parsed = UpsertSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const data = parsed.data;
    const row = await prisma.carrierPolicy.upsert({
      where: { zoneId: data.zone_id },
      create: {
        zoneId: data.zone_id,
        policy: data.policy ?? "DEFAULT",
        defaultCarrier: data.default_carrier ?? "JP_POST",
        forceDhlOverWeightKg: data.force_dhl_over_weight_kg ?? null,
        forceDhlOverSubtotalUsdCents:
          data.force_dhl_over_subtotal_usd != null ? usdToCents(data.force_dhl_over_subtotal_usd) : null,
      },
      update: {
        ...(data.policy ? { policy: data.policy } : {}),
        ...(data.default_carrier ? { defaultCarrier: data.default_carrier } : {}),
        ...(data.force_dhl_over_weight_kg !== undefined ? { forceDhlOverWeightKg: data.force_dhl_over_weight_kg } : {}),
        ...(data.force_dhl_over_subtotal_usd !== undefined
          ? { forceDhlOverSubtotalUsdCents: data.force_dhl_over_subtotal_usd != null ? usdToCents(data.force_dhl_over_subtotal_usd) : null }
          : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        adminUserId: String(token.sub),
        action: "upsert_carrier_policy",
        entityType: "CarrierPolicy",
        entityId: row.id,
        meta: data,
      },
    });

    return NextResponse.json({ ok: true, policy: row });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // eslint-disable-next-line no-console
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

