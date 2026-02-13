import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/ratelimit";

const BodySchema = z.object({
  name: z.enum(["PageView", "AddToCart", "StartCheckout", "SubmitQuote", "SubmitProcure"]),
  path: z.string().min(1).max(2048),
  country: z.string().max(64).optional(),
  variantId: z.string().max(128).optional(),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit({ key: `event:${ip}`, limit: 120, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { name, path, country, variantId } = parsed.data;
  await prisma.analyticsEvent.create({
    data: {
      name,
      path,
      country: country?.trim() || null,
      variantId: variantId?.trim() || null,
    },
  });

  return NextResponse.json({ ok: true });
}

