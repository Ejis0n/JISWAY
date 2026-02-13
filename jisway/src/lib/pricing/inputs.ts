import type { FxRate, PricingRule, Variant, Product, CostBasis, SupplierAvailability } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type SelectedFx = { jpyPerUsd: number; fxRate: FxRate };

export type SelectedRule = { rule: PricingRule };

export type SelectedCost = {
  costBasis: CostBasis;
  confidence: "high" | "medium" | "low";
};

export async function selectLatestFxRate(): Promise<SelectedFx> {
  const fx = await prisma.fxRate.findFirst({
    where: { pair: "JPYUSD" },
    orderBy: { capturedAt: "desc" },
  });
  if (!fx) throw new Error("FX rate not set (JPYUSD). Add it in /admin/pricing.");
  if (!Number.isFinite(fx.rate) || fx.rate <= 0) throw new Error("Invalid FX rate.");
  return { jpyPerUsd: fx.rate, fxRate: fx };
}

export async function selectPricingRuleForVariant(input: {
  variant: Variant & { product: Product };
}): Promise<SelectedRule> {
  const v = input.variant;

  const rules = await prisma.pricingRule.findMany({
    orderBy: [{ scope: "asc" }, { updatedAt: "desc" }],
  });

  const byVariant = rules.find((r) => r.scope === "variant" && r.variantId === v.id);
  if (byVariant) return { rule: byVariant };

  const bySize = rules.find(
    (r) => r.scope === "size" && r.size?.toUpperCase() === v.product.size.toUpperCase(),
  );
  if (bySize) return { rule: bySize };

  const byCategory = rules.find((r) => r.scope === "category" && r.category === v.product.category);
  if (byCategory) return { rule: byCategory };

  const global = rules.find((r) => r.scope === "global");
  if (global) return { rule: global };

  // Safe default if none configured
  const fallback = await prisma.pricingRule.create({
    data: {
      scope: "global",
      targetGrossMargin: 0.55,
      minPriceUsdCents: 500,
      maxPriceUsdCents: 50000,
      rounding: "USD_0_99",
      maxWeeklyChangePct: 0.15,
    },
  });
  return { rule: fallback };
}

function isAcceptableAvailability(a: SupplierAvailability | null) {
  return a == null || a !== "backorder";
}

export async function selectCostBasisForVariant(input: {
  variantId: string;
  lookbackDays?: number;
}): Promise<SelectedCost> {
  const lookbackDays = input.lookbackDays ?? 30;
  const since = new Date(Date.now() - lookbackDays * 86400_000);

  const recent = await prisma.costBasis.findMany({
    where: { variantId: input.variantId, capturedAt: { gte: since } },
    orderBy: [{ capturedAt: "desc" }],
    take: 200,
  });

  const filtered = recent.filter((c) => isAcceptableAvailability(c.availability ?? null));
  if (filtered.length) {
    // Prefer cheapest among recent; if tie, prefer supplier_offer; if tie, newest.
    const sorted = filtered.sort((a, b) => {
      if (a.costJpyPerPack !== b.costJpyPerPack) return a.costJpyPerPack - b.costJpyPerPack;
      if (a.source !== b.source) return a.source === "supplier_offer" ? -1 : 1;
      return b.capturedAt.getTime() - a.capturedAt.getTime();
    });
    return { costBasis: sorted[0], confidence: "high" };
  }

  const latest = await prisma.costBasis.findFirst({
    where: { variantId: input.variantId },
    orderBy: { capturedAt: "desc" },
  });
  if (!latest) throw new Error(`No cost basis for variant ${input.variantId}`);
  return { costBasis: latest, confidence: "low" };
}

