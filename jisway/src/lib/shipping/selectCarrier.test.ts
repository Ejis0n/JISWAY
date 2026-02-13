import { describe, expect, it } from "vitest";
import { selectCarrier } from "@/lib/shipping/selectCarrier";
import type { ShippingCarrier, ShippingRuleBand } from "@prisma/client";

describe("selectCarrier", () => {
  const rules: Array<{
    band: ShippingRuleBand;
    carrier: ShippingCarrier;
    priceUsdCents: number;
    etaMinDays: number;
    etaMaxDays: number;
    trackingIncluded: boolean;
  }> = [
    // JP_POST
    { band: "BAND_A_10PCS", carrier: "JP_POST", priceUsdCents: 1800, etaMinDays: 8, etaMaxDays: 14, trackingIncluded: true },
    { band: "BAND_B_20PCS", carrier: "JP_POST", priceUsdCents: 2800, etaMinDays: 8, etaMaxDays: 14, trackingIncluded: true },
    // DHL
    { band: "BAND_A_10PCS", carrier: "DHL", priceUsdCents: 2600, etaMinDays: 4, etaMaxDays: 7, trackingIncluded: true },
    { band: "BAND_B_20PCS", carrier: "DHL", priceUsdCents: 3800, etaMinDays: 4, etaMaxDays: 7, trackingIncluded: true },
  ];

  it("DEFAULT prefers JP_POST for non-Oceania when available", () => {
    const out = selectCarrier({
      zoneName: "ASEAN",
      bands: ["BAND_A_10PCS"],
      subtotalUsdCents: 10_000,
      weightKg: 0.2,
      policy: null,
      rules,
    });
    expect(out.carrier).toBe("JP_POST");
    expect(out.shippingPriceUsdCents).toBe(1800);
  });

  it("FASTEST picks lowest eta_min_days", () => {
    const out = selectCarrier({
      zoneName: "ASEAN",
      bands: ["BAND_A_10PCS"],
      subtotalUsdCents: 10_000,
      weightKg: 0.2,
      policy: { policy: "FASTEST", defaultCarrier: "JP_POST", forceDhlOverWeightKg: null, forceDhlOverSubtotalUsdCents: null },
      rules,
    });
    expect(out.carrier).toBe("DHL");
    expect(out.etaMinDays).toBe(4);
  });

  it("Force DHL when subtotal threshold is exceeded and DHL exists", () => {
    const out = selectCarrier({
      zoneName: "ASEAN",
      bands: ["BAND_A_10PCS", "BAND_B_20PCS"],
      subtotalUsdCents: 25_000,
      weightKg: 0.9,
      policy: { policy: "DEFAULT", defaultCarrier: "JP_POST", forceDhlOverWeightKg: null, forceDhlOverSubtotalUsdCents: 20_000 },
      rules,
    });
    expect(out.carrier).toBe("DHL");
    // base 3800 + surcharge 500
    expect(out.shippingPriceUsdCents).toBe(4300);
    expect(out.forcedDhl).toBe(true);
  });
});

