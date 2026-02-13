import type { ShippingRuleBand } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveZone } from "@/lib/shipping/zones";
import { ruleBandForPackType } from "@/lib/shipping/bands";
import { selectCarrier } from "@/lib/shipping/selectCarrier";

export type CartLineInput = { variantId: string; quantity: number }; // variantId == Variant.slug

const EST_WEIGHT_KG_PER_PACK: Record<ShippingRuleBand, number> = {
  BAND_A_10PCS: 0.3,
  BAND_B_20PCS: 0.6,
  BAND_C_BULK: 1.5,
};

export async function quoteShipping(input: { countryCode: string; items: CartLineInput[] }) {
  const slugs = input.items.map((i) => i.variantId);
  const variants = await prisma.variant.findMany({
    where: { slug: { in: slugs }, active: true, product: { active: true } },
    include: { product: true },
  });
  const bySlug = new Map(variants.map((v) => [v.slug, v]));

  let subtotalUsdCents = 0;
  const bands: ShippingRuleBand[] = [];
  let weightKg = 0;

  for (const item of input.items) {
    const v = bySlug.get(item.variantId);
    if (!v) throw new Error(`Unknown variant: ${item.variantId}`);
    subtotalUsdCents += v.priceUsd * item.quantity;
    const band = ruleBandForPackType(v.packType);
    bands.push(band);
    weightKg += (EST_WEIGHT_KG_PER_PACK[band] ?? 0.5) * item.quantity;
  }

  const zone = await resolveZone(input.countryCode);
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

  const selected = selectCarrier({
    zoneName: zone.name,
    bands,
    subtotalUsdCents,
    weightKg,
    policy,
    rules,
  });

  const baseRuleNote =
    rules.find((r) => r.carrier === selected.carrier && r.band === selected.bandBreakdown.baseBand)?.notes ?? null;

  return {
    zone: { id: zone.id, name: zone.name },
    subtotalUsdCents,
    weightKg,
    ...selected,
    warningNote: baseRuleNote,
  };
}

