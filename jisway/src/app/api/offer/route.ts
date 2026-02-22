import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/ratelimit";

const BodySchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  company: z.string().optional(),
  country: z.string().optional(),
  variantId: z.string().optional(),
  offeredPriceUsd: z.number().positive().optional(), // USD (e.g. 1.99)
  quantity: z.number().int().positive().optional(),
  message: z.string().optional(),
});

function usdToCents(usd: number) {
  return Math.round(usd * 100);
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit({ key: `offer:${ip}`, limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    const retryAfter = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      { error: "Rate limited" },
      { status: 429, headers: { "retry-after": String(retryAfter) } },
    );
  }

  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { email, name, company, country, variantId, offeredPriceUsd, quantity, message } = parsed.data;

  // Catalog sends slug-like ids; resolve to DB Variant.id (cuid) or leave null
  let dbVariantId: string | null = null;
  if (variantId?.trim()) {
    const v = await prisma.variant.findFirst({
      where: { OR: [{ id: variantId.trim() }, { slug: variantId.trim() }] },
      select: { id: true },
    });
    dbVariantId = v?.id ?? null;
  }

  const created = await prisma.customerOffer.create({
    data: {
      status: "NEW",
      email: email.trim(),
      name: name?.trim() || null,
      company: company?.trim() || null,
      country: country?.trim() || null,
      variantId: dbVariantId,
      offeredPriceUsdCents: offeredPriceUsd != null ? usdToCents(offeredPriceUsd) : null,
      quantity: quantity ?? null,
      message: message?.trim() || null,
    },
  });

  await prisma.appEvent.create({
    data: {
      type: "customer_offer_submitted",
      meta: { offerId: created.id, email },
    },
  });

  return NextResponse.json({ ok: true, id: created.id });
}
