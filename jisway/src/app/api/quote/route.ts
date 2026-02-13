import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getVariantById } from "@/lib/catalog";
import { sendEmail } from "@/lib/email";
import { getClientIp, rateLimit } from "@/lib/ratelimit";
import { seoTitle } from "@/lib/seo/templates";
import { buildOrderOpsFooterLines } from "@/lib/opsCopy";

const CartItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().positive(),
});

const BodySchema = z.object({
  name: z.string().min(1),
  company: z.string().min(1),
  email: z.string().email(),
  country: z.string().min(1),
  notes: z.string().optional(),
  cartItems: z.array(CartItemSchema).min(1),
});

function usdToCents(usd: number) {
  return Math.round(usd * 100);
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit({ key: `quote:${ip}`, limit: 10, windowMs: 60_000 });
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

  const { name, company, email, country, notes, cartItems } = parsed.data;

  const snapshotItems: Array<{
    id: string;
    title: string;
    qty: number;
    unit_usd: number;
    line_usd: number;
  }> = [];

  let subtotalUsd = 0;
  for (const item of cartItems) {
    const v = getVariantById(item.variantId);
    if (!v) return NextResponse.json({ error: `Unknown variant: ${item.variantId}` }, { status: 400 });
    const line = v.price_usd * item.quantity;
    subtotalUsd += line;
    snapshotItems.push({
      id: v.id,
      title: seoTitle(v),
      qty: item.quantity,
      unit_usd: v.price_usd,
      line_usd: line,
    });
  }

  const created = await prisma.quoteRequest.create({
    data: {
      status: "NEW",
      email,
      name: name.trim(),
      company: company.trim(),
      country: country.trim(),
      message: notes?.trim() || null,
      subtotalUsd: usdToCents(subtotalUsd),
      cartSnapshot: { items: snapshotItems, subtotal_usd: subtotalUsd },
    },
  });

  await prisma.appEvent.create({
    data: {
      type: "quote_submitted",
      meta: { quoteId: created.id, email, subtotalUsd },
    },
  });

  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (adminEmail) {
    await sendEmail({
      to: adminEmail,
      subject: `New quote request (${created.id})`,
      text: [
        `QuoteRequest ID: ${created.id}`,
        `Email: ${email}`,
        name ? `Name: ${name}` : "",
        company ? `Company: ${company}` : "",
        country ? `Country: ${country}` : "",
        `Subtotal (USD): ${subtotalUsd.toFixed(2)}`,
        "",
        "Items:",
        ...snapshotItems.map((x) => `- ${x.title} | Qty ${x.qty} | $${x.line_usd.toFixed(2)}`),
        "",
        notes ? `Notes: ${notes}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    });
  }

  await sendEmail({
    to: email,
    subject: "Quote request received",
    text: [
      "We received your quote request.",
      "",
      `Request ID: ${created.id}`,
      `Subtotal (USD): ${subtotalUsd.toFixed(2)}`,
      "",
      ...buildOrderOpsFooterLines(),
    ].join("\n"),
  });

  return NextResponse.json({ ok: true, id: created.id });
}

