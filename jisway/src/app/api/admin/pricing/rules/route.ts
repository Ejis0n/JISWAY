import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminToken } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
  scope: z.enum(["global", "category", "size", "variant"]),
  category: z.enum(["bolt", "nut", "washer"]).optional(),
  size: z.string().optional(),
  variant_id: z.string().optional(),
  target_gross_margin: z.number().min(0).max(0.95),
  min_price_usd: z.number().positive(),
  max_price_usd: z.number().positive(),
  rounding: z.enum(["USD_0_00", "USD_0_99", "USD_0_49"]),
  max_weekly_change_pct: z.number().min(0).max(1),
});

function usdToCents(usd: number) {
  return Math.round(usd * 100);
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminToken(req);
    const json = (await req.json().catch(() => null)) as unknown;
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const rule = await prisma.pricingRule.create({
      data: {
        scope: parsed.data.scope,
        category: parsed.data.scope === "category" ? (parsed.data.category as any) : null,
        size: parsed.data.scope === "size" ? (parsed.data.size?.toUpperCase() ?? null) : null,
        variantId: parsed.data.scope === "variant" ? (parsed.data.variant_id ?? null) : null,
        targetGrossMargin: parsed.data.target_gross_margin,
        minPriceUsdCents: usdToCents(parsed.data.min_price_usd),
        maxPriceUsdCents: usdToCents(parsed.data.max_price_usd),
        rounding: parsed.data.rounding,
        maxWeeklyChangePct: parsed.data.max_weekly_change_pct,
      },
    });

    return NextResponse.json({ ok: true, id: rule.id });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

