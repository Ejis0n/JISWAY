import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getVariantById } from "@/lib/catalog";
import crypto from "node:crypto";
import { getAppBaseUrl } from "@/lib/baseUrl";
import { getClientIp, rateLimit } from "@/lib/ratelimit";
import { seoTitle } from "@/lib/seo/templates";
import { resolveZone } from "@/lib/shipping/zones";
import { ruleBandForPackType } from "@/lib/shipping/bands";
import { selectCarrier } from "@/lib/shipping/selectCarrier";

const BodySchema = z.object({
  countryCode: z.string().min(2).max(2).optional(),
  ack_exact_spec: z.boolean().optional(),
  ack_no_inventory: z.boolean().optional(),
  ack_duties_taxes: z.boolean().optional(),
  ack_refund_policy: z.boolean().optional(),
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

const QUOTE_THRESHOLD_USD = 300;

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit({ key: `checkout:${ip}`, limit: 20, windowMs: 60_000 });
  if (!rl.ok) {
    const retryAfter = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      { error: "Rate limited" },
      { status: 429, headers: { "retry-after": String(retryAfter) } },
    );
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
  }

  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  // Resolve variants from DB (slug == catalog id). Also build line_items from catalog for names.
  const cart = parsed.data.items;
  const countryCode = (parsed.data.countryCode ?? "ZZ").toUpperCase();
  const ackExactSpec = Boolean(parsed.data.ack_exact_spec);
  const ackNoInventory = Boolean(parsed.data.ack_no_inventory);
  const ackDutiesTaxes = Boolean(parsed.data.ack_duties_taxes);
  const ackRefundPolicy = Boolean(parsed.data.ack_refund_policy);
  const acksOk = ackExactSpec && ackNoInventory && ackDutiesTaxes && ackRefundPolicy;
  if (!acksOk) {
    return NextResponse.json({ error: "Acknowledgements required" }, { status: 400 });
  }
  const slugs = cart.map((i) => i.variantId);
  const variants = await prisma.variant.findMany({
    where: { slug: { in: slugs }, active: true, product: { active: true } },
    include: { product: true },
  });

  const bySlug = new Map(variants.map((v) => [v.slug, v]));
  let subtotalCents = 0;
  const cartBands: Array<import("@prisma/client").ShippingRuleBand> = [];
  let weightKg = 0;

  for (const item of cart) {
    const v = bySlug.get(item.variantId);
    if (!v) return NextResponse.json({ error: `Unknown variant: ${item.variantId}` }, { status: 400 });
    subtotalCents += v.priceUsd * item.quantity;
    const band = ruleBandForPackType(v.packType);
    cartBands.push(band);
    // simple weight estimate per pack (kg)
    weightKg += (band === "BAND_A_10PCS" ? 0.3 : band === "BAND_B_20PCS" ? 0.6 : 1.5) * item.quantity;
  }

  const subtotalUsd = subtotalCents / 100;
  if (subtotalUsd >= QUOTE_THRESHOLD_USD) {
    return NextResponse.json(
      { error: "Subtotal requires quote. Please request a quote." },
      { status: 400 },
    );
  }

  const zone = await resolveZone(countryCode);
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
    },
  });
  const selected = selectCarrier({
    zoneName: zone.name,
    bands: cartBands,
    subtotalUsdCents: subtotalCents,
    weightKg,
    policy,
    rules,
  });

  const shippingCents = selected.shippingPriceUsdCents;
  const totalCents = subtotalCents + shippingCents;

  const siteUrl = getAppBaseUrl();

  // Create pending Order + items (email filled by webhook)
  const order = await prisma.order.create({
    data: {
      status: "created",
      email: null,
      country: countryCode,
      subtotalUsd: subtotalCents,
      shippingUsd: shippingCents,
      totalUsd: totalCents,
      currency: "usd",
      stripeCheckoutSessionId: `pending_${crypto.randomUUID()}`, // temp unique, updated after session create
      acknowledgements: {
        create: {
          ackExactSpec,
          ackNoInventory,
          ackDutiesTaxes,
          ackRefundPolicy,
          ipAddress: ip,
          userAgent: req.headers.get("user-agent"),
          acknowledgedAt: new Date(),
        },
      },
      orderShipping: {
        create: {
          zoneId: zone.id,
          carrier: selected.carrier,
          band: selected.bandBreakdown.baseBand,
          shippingPriceUsd: shippingCents,
          etaMinDays: selected.etaMinDays,
          etaMaxDays: selected.etaMaxDays,
        },
      },
      items: {
        create: cart.map((item) => {
          const v = bySlug.get(item.variantId)!;
          const catalog = getVariantById(item.variantId);
          return {
            variantId: v.id,
            quantity: item.quantity,
            unitPriceUsd: v.priceUsd,
            lineTotalUsd: v.priceUsd * item.quantity,
            specSnapshot: {
              id: v.slug,
              title: catalog ? seoTitle(catalog) : v.slug,
              size: v.product.size,
              length_mm: v.product.length,
              pack: v.packType,
              finish: v.product.finish,
              strength: v.product.strengthClass,
            },
          };
        }),
      },
    },
  });

  const line_items = cart.map((item) => {
    const cat = getVariantById(item.variantId);
    const v = bySlug.get(item.variantId)!;
    return {
      quantity: item.quantity,
      price_data: {
        currency: "usd",
        unit_amount: v.priceUsd,
        product_data: {
          name: cat ? seoTitle(cat) : v.slug,
        },
      },
    };
  });
  line_items.push({
    quantity: 1,
    price_data: {
      currency: "usd",
      unit_amount: shippingCents,
      product_data: { name: `Shipping (${selected.carrier})` },
    },
  });

  const stripe = getStripe();
  const receiptDescription = [
    `Order ${order.id}`,
    "Exact JIS specification. No substitutes.",
    "Procured after payment confirmation.",
  ].join(" | ");
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items,
    payment_intent_data: {
      description: receiptDescription,
      statement_descriptor: "JISWAY JAPAN",
      statement_descriptor_suffix: "IND SUPPLY",
      metadata: { order_id: order.id },
    },
    success_url: `${siteUrl}/?success=1`,
    cancel_url: `${siteUrl}/cart?canceled=1`,
    metadata: {
      order_id: order.id,
    },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { stripeCheckoutSessionId: session.id },
  });

  // Link acknowledgement record to checkout session + evidence snapshot
  await prisma.orderAcknowledgement.updateMany({
    where: { orderId: order.id, checkoutSessionId: null },
    data: { checkoutSessionId: session.id },
  });
  await prisma.orderEvidence.create({
    data: {
      orderId: order.id,
      type: "acknowledgement",
      textContent: [
        "Checkout acknowledgements (captured before Stripe redirect)",
        `ack_exact_spec: ${ackExactSpec}`,
        `ack_no_inventory: ${ackNoInventory}`,
        `ack_duties_taxes: ${ackDutiesTaxes}`,
        `ack_refund_policy: ${ackRefundPolicy}`,
        `ip: ${ip}`,
        `user_agent: ${req.headers.get("user-agent") ?? ""}`,
        `acknowledged_at: ${new Date().toISOString()}`,
      ].join("\n"),
    },
  });

  await prisma.appEvent.create({
    data: {
      type: "checkout_session_created",
      meta: {
        orderId: order.id,
        sessionId: session.id,
        subtotalUsd,
        shippingCents,
        countryCode,
        acknowledgements: {
          ack_exact_spec: ackExactSpec,
          ack_no_inventory: ackNoInventory,
          ack_duties_taxes: ackDutiesTaxes,
          ack_refund_policy: ackRefundPolicy,
        },
        shipping: {
          zone: zone.name,
          carrier: selected.carrier,
          eta: `${selected.etaMinDays}-${selected.etaMaxDays}`,
          forcedDhl: selected.forcedDhl,
        },
      },
    },
  });

  return NextResponse.json({ url: session.url });
}

