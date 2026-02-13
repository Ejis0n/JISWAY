import { NextResponse } from "next/server";
import { z } from "zod";
import { quoteShipping } from "@/lib/shipping/quote";
import { getClientIp, rateLimit } from "@/lib/ratelimit";

const BodySchema = z.object({
  countryCode: z.string().min(2).max(2).optional(),
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit({ key: `shipquote:${ip}`, limit: 60, windowMs: 60_000 });
  if (!rl.ok) {
    const retryAfter = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      { error: "Rate limited" },
      { status: 429, headers: { "retry-after": String(retryAfter) } },
    );
  }

  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  try {
    const cc = (parsed.data.countryCode ?? "ZZ").toUpperCase();
    const out = await quoteShipping({ countryCode: cc, items: parsed.data.items });
    return NextResponse.json({
      zone: out.zone,
      carrier: out.carrier,
      shipping_price_usd: out.shippingPriceUsdCents / 100,
      shipping_price_usd_cents: out.shippingPriceUsdCents,
      eta_min_days: out.etaMinDays,
      eta_max_days: out.etaMaxDays,
      tracking_included: out.trackingIncluded,
      band_breakdown: out.bandBreakdown,
      warning_note: out.warningNote,
      duties_note: "Import duties and taxes are the responsibility of the recipient.",
      forced_dhl: out.forcedDhl,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}

