import type { RoundingStrategy } from "@prisma/client";

export type PricingBreakdown = {
  jpy_per_usd: number;
  cost_jpy_per_pack: number;
  cost_usd: number;
  handling_usd: number;
  base_usd: number;
  target_margin: number;
  fee_rate: number;
  fixed_fee_usd: number;
  price_before_fees: number;
  price_with_fees: number;
  rounding: string;
  clamped_min_max: boolean;
  weekly_change_clamped: boolean;
  min_safe_floor_applied: boolean;
  final_usd: number;
};

export type CalcInput = {
  current_price_usd_cents: number;
  cost_jpy_per_pack: number;
  jpy_per_usd: number;
  target_gross_margin: number;
  min_price_usd_cents: number;
  max_price_usd_cents: number;
  rounding: RoundingStrategy;
  max_weekly_change_pct: number;
  fee_rate?: number; // default 0.035
  fixed_fee_usd_cents?: number; // default 30
  handling_usd_cents?: number; // default 150
  allow_override?: boolean; // if true, do not clamp weekly change
};

function centsToUsd(cents: number) {
  return cents / 100;
}

function usdToCents(usd: number) {
  return Math.round(usd * 100);
}

function roundByStrategy(cents: number, strategy: RoundingStrategy) {
  if (strategy === "USD_0_00") {
    return Math.max(0, Math.round(cents / 100) * 100);
  }
  if (strategy === "USD_0_49") {
    const d = Math.ceil((cents - 49) / 100);
    return Math.max(0, d * 100 + 49);
  }
  // USD_0_99
  const d = Math.ceil(cents / 100);
  return Math.max(0, d * 100 - 1);
}

export function calcRecommendedPrice(input: CalcInput) {
  if (!Number.isFinite(input.jpy_per_usd) || input.jpy_per_usd <= 0) throw new Error("Invalid FX rate");
  if (!Number.isFinite(input.cost_jpy_per_pack) || input.cost_jpy_per_pack <= 0) throw new Error("Invalid cost");

  const feeRate = input.fee_rate ?? 0.035;
  const fixedFeeCents = input.fixed_fee_usd_cents ?? 30;
  const handlingCents = input.handling_usd_cents ?? 150;

  const costUsd = input.cost_jpy_per_pack / input.jpy_per_usd;
  const costUsdCents = usdToCents(costUsd);

  const baseCents = costUsdCents + handlingCents;
  const margin = Math.min(0.95, Math.max(0, input.target_gross_margin));
  const priceBeforeFeesCents = baseCents / (1 - margin);
  const priceWithFeesCents = (priceBeforeFeesCents + fixedFeeCents) / (1 - feeRate);

  let candidate = Math.ceil(priceWithFeesCents);
  candidate = roundByStrategy(candidate, input.rounding);

  let clampedMinMax = false;
  let weeklyChangeClamped = false;
  let minSafeFloorApplied = false;

  // Never below cost + handling + fixed fee (hard floor)
  const minSafeFloor = baseCents + fixedFeeCents;
  if (candidate < minSafeFloor) {
    candidate = Math.ceil(minSafeFloor);
    candidate = roundByStrategy(candidate, input.rounding);
    minSafeFloorApplied = true;
  }

  // Clamp to rule bounds
  if (candidate < input.min_price_usd_cents) {
    candidate = input.min_price_usd_cents;
    clampedMinMax = true;
  }
  if (candidate > input.max_price_usd_cents) {
    candidate = input.max_price_usd_cents;
    clampedMinMax = true;
  }

  // Weekly change guardrail
  const cur = input.current_price_usd_cents;
  if (!input.allow_override && cur > 0 && input.max_weekly_change_pct > 0) {
    const maxPct = input.max_weekly_change_pct;
    const diffPct = Math.abs(candidate - cur) / cur;
    if (diffPct > maxPct) {
      const direction = candidate >= cur ? 1 : -1;
      const limited = Math.round(cur * (1 + direction * maxPct));
      candidate = limited;
      candidate = roundByStrategy(candidate, input.rounding);
      weeklyChangeClamped = true;
    }
  }

  const breakdown: PricingBreakdown = {
    jpy_per_usd: input.jpy_per_usd,
    cost_jpy_per_pack: input.cost_jpy_per_pack,
    cost_usd: costUsd,
    handling_usd: centsToUsd(handlingCents),
    base_usd: centsToUsd(baseCents),
    target_margin: margin,
    fee_rate: feeRate,
    fixed_fee_usd: centsToUsd(fixedFeeCents),
    price_before_fees: centsToUsd(priceBeforeFeesCents),
    price_with_fees: centsToUsd(priceWithFeesCents),
    rounding: input.rounding,
    clamped_min_max: clampedMinMax,
    weekly_change_clamped: weeklyChangeClamped,
    min_safe_floor_applied: minSafeFloorApplied,
    final_usd: centsToUsd(candidate),
  };

  return {
    recommended_price_usd_cents: candidate,
    breakdown,
  };
}

