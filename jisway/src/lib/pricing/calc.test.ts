import { describe, it, expect } from "vitest";
import { calcRecommendedPrice } from "@/lib/pricing/calc";

describe("calcRecommendedPrice", () => {
  it("applies .99 rounding", () => {
    const r = calcRecommendedPrice({
      current_price_usd_cents: 1000,
      cost_jpy_per_pack: 1000,
      jpy_per_usd: 100,
      target_gross_margin: 0.5,
      min_price_usd_cents: 100,
      max_price_usd_cents: 100000,
      rounding: "USD_0_99",
      max_weekly_change_pct: 1,
      fee_rate: 0,
      fixed_fee_usd_cents: 0,
      handling_usd_cents: 0,
      allow_override: true,
    });
    expect(r.recommended_price_usd_cents % 100).toBe(99);
  });

  it("clamps weekly change when override is false", () => {
    const r = calcRecommendedPrice({
      current_price_usd_cents: 10000,
      cost_jpy_per_pack: 1,
      jpy_per_usd: 100,
      target_gross_margin: 0.1,
      min_price_usd_cents: 100,
      max_price_usd_cents: 100000,
      rounding: "USD_0_00",
      max_weekly_change_pct: 0.1,
      fee_rate: 0,
      fixed_fee_usd_cents: 0,
      handling_usd_cents: 0,
      allow_override: false,
    });
    // Candidate would be tiny; weekly clamp pulls it toward current by max pct
    const diffPct = Math.abs(r.recommended_price_usd_cents - 10000) / 10000;
    expect(diffPct).toBeLessThanOrEqual(0.11);
  });
});

