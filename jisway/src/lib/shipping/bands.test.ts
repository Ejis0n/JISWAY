import { describe, expect, it } from "vitest";
import { computeFlatBandShippingUsdCents } from "@/lib/shipping/bands";
import type { ShippingRuleBand } from "@prisma/client";

describe("computeFlatBandShippingUsdCents", () => {
  it("uses max band price and adds $5 per additional band", () => {
    const priceByBand = new Map<ShippingRuleBand, number>([
      ["BAND_A_10PCS", 1800],
      ["BAND_B_20PCS", 2800],
    ]);

    const out = computeFlatBandShippingUsdCents({
      bands: ["BAND_A_10PCS", "BAND_B_20PCS"],
      priceUsdCentsByBand: priceByBand,
    });

    expect(out.basePriceUsdCents).toBe(2800);
    expect(out.surchargeUsdCents).toBe(500);
    expect(out.totalUsdCents).toBe(3300);
  });
});

