import type { ProductCategory, Variant, Product, PricingRule } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { selectCostBasisForVariant, selectLatestFxRate, selectPricingRuleForVariant } from "@/lib/pricing/inputs";
import { calcRecommendedPrice } from "@/lib/pricing/calc";

export type RepriceRow = {
  variant_id: string;
  slug: string;
  category: ProductCategory;
  size: string;
  packType: string;
  current_price_usd_cents: number;
  recommended_price_usd_cents: number;
  pct_change: number;
  breakdown: unknown;
};

export type PreviewOptions = {
  category?: ProductCategory;
  size?: string;
  limit?: number;
  allowOverride?: boolean;
};

function pctChange(cur: number, next: number) {
  if (!cur) return 0;
  return (next - cur) / cur;
}

function handlingForBand(variant: Pick<Variant, "shippingBand">) {
  // Simple per-band handling (USD cents). BAND_A is lighter/smaller.
  return variant.shippingBand === "BAND_A" ? 150 : 200;
}

export async function previewReprice(opts: PreviewOptions = {}) {
  const fx = await selectLatestFxRate();

  const variants = await prisma.variant.findMany({
    where: {
      active: true,
      product: { active: true, ...(opts.category ? { category: opts.category } : {}), ...(opts.size ? { size: opts.size } : {}) },
    },
    include: { product: true },
    orderBy: [{ updatedAt: "desc" }],
    take: Math.min(500, Math.max(1, opts.limit ?? 200)),
  });

  const rows: RepriceRow[] = [];
  for (const v of variants) {
    const cost = await selectCostBasisForVariant({ variantId: v.id });
    const ruleSel = await selectPricingRuleForVariant({ variant: v });
    const rule = ruleSel.rule;

    const handling = handlingForBand(v);
    const res = calcRecommendedPrice({
      current_price_usd_cents: v.priceUsd,
      cost_jpy_per_pack: cost.costBasis.costJpyPerPack,
      jpy_per_usd: fx.jpyPerUsd,
      target_gross_margin: rule.targetGrossMargin,
      min_price_usd_cents: rule.minPriceUsdCents,
      max_price_usd_cents: rule.maxPriceUsdCents,
      rounding: rule.rounding,
      max_weekly_change_pct: rule.maxWeeklyChangePct,
      handling_usd_cents: handling,
      allow_override: opts.allowOverride ?? false,
    });

    rows.push({
      variant_id: v.id,
      slug: v.slug,
      category: v.product.category,
      size: v.product.size,
      packType: v.packType,
      current_price_usd_cents: v.priceUsd,
      recommended_price_usd_cents: res.recommended_price_usd_cents,
      pct_change: pctChange(v.priceUsd, res.recommended_price_usd_cents),
      breakdown: {
        fx: { jpy_per_usd: fx.jpyPerUsd, captured_at: fx.fxRate.capturedAt },
        cost: { ...cost, captured_at: cost.costBasis.capturedAt },
        rule: {
          id: rule.id,
          scope: rule.scope,
          category: rule.category,
          size: rule.size,
          target_gross_margin: rule.targetGrossMargin,
          min_price_usd_cents: rule.minPriceUsdCents,
          max_price_usd_cents: rule.maxPriceUsdCents,
          rounding: rule.rounding,
          max_weekly_change_pct: rule.maxWeeklyChangePct,
          updated_at: rule.updatedAt,
        },
        calc: res.breakdown,
      },
    });
  }

  return rows;
}

export async function applyReprice(input: { adminUserId: string; opts?: PreviewOptions }) {
  const rows = await previewReprice(input.opts);
  const toApply = rows.filter((r) => r.current_price_usd_cents !== r.recommended_price_usd_cents);

  const applied = await prisma.$transaction(async (tx) => {
    let updatedCount = 0;
    for (const r of toApply) {
      await tx.priceChangeLog.create({
        data: {
          variantId: r.variant_id,
          oldPriceUsd: r.current_price_usd_cents,
          newPriceUsd: r.recommended_price_usd_cents,
          reasonJson: r.breakdown as any,
          appliedByAdminId: input.adminUserId,
        },
      });
      await tx.variant.update({
        where: { id: r.variant_id },
        data: { priceUsd: r.recommended_price_usd_cents },
      });
      updatedCount += 1;
    }
    return { updatedCount };
  });

  return { updatedCount: applied.updatedCount, preview: rows };
}

