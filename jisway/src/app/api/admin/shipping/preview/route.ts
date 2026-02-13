import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminToken } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { resolveZone } from "@/lib/shipping/zones";
import { selectCarrier } from "@/lib/shipping/selectCarrier";

const BodySchema = z.object({
  country_code: z.string().min(2).max(2),
  bands: z.array(z.enum(["BAND_A_10PCS", "BAND_B_20PCS", "BAND_C_BULK"])).min(1),
  subtotal_usd: z.number().nonnegative(),
  weight_kg: z.number().nonnegative(),
});

function usdToCents(n: number) {
  return Math.round(n * 100);
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminToken(req);
    const json = (await req.json().catch(() => null)) as unknown;
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const zone = await resolveZone(parsed.data.country_code.toUpperCase());
    const policy = await prisma.carrierPolicy.findFirst({ where: { zoneId: zone.id } });
    const rules = await prisma.shippingRule.findMany({
      where: { zoneId: zone.id },
      select: {
        band: true,
        carrier: true,
        priceUsdCents: true,
        etaMinDays: true,
        etaMaxDays: true,
        trackingIncluded: true,
        notes: true,
      },
    });

    const out = selectCarrier({
      zoneName: zone.name,
      bands: parsed.data.bands,
      subtotalUsdCents: usdToCents(parsed.data.subtotal_usd),
      weightKg: parsed.data.weight_kg,
      policy,
      rules,
    });

    const baseRuleNote =
      rules.find((r) => r.carrier === out.carrier && r.band === out.bandBreakdown.baseBand)?.notes ?? null;

    return NextResponse.json({
      zone: { id: zone.id, name: zone.name },
      ...out,
      shipping_price_usd: out.shippingPriceUsdCents / 100,
      warning_note: baseRuleNote,
      duties_note: "Import duties and taxes are the responsibility of the recipient.",
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // eslint-disable-next-line no-console
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

