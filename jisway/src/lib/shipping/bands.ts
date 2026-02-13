import type { PackType, ShippingRuleBand } from "@prisma/client";

export function ruleBandForPackType(packType: PackType): ShippingRuleBand {
  switch (packType) {
    case "PACK_10":
      return "BAND_A_10PCS";
    case "PACK_20":
      return "BAND_B_20PCS";
    case "PACK_50":
    case "PACK_100":
      return "BAND_C_BULK";
    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustive: never = packType;
      return "BAND_C_BULK";
    }
  }
}

export function distinctBands(bands: ShippingRuleBand[]) {
  return Array.from(new Set(bands));
}

export type BandPriceInput = {
  bands: ShippingRuleBand[];
  priceUsdCentsByBand: Map<ShippingRuleBand, number>;
  surchargePerExtraBandUsdCents?: number; // default $5
};

export type BandPriceBreakdown = {
  distinctBands: ShippingRuleBand[];
  baseBand: ShippingRuleBand;
  basePriceUsdCents: number;
  surchargeUsdCents: number;
  totalUsdCents: number;
};

export function computeFlatBandShippingUsdCents(input: BandPriceInput): BandPriceBreakdown {
  const surchargePerExtra = input.surchargePerExtraBandUsdCents ?? 500;
  const bands = distinctBands(input.bands);
  if (bands.length === 0) {
    return {
      distinctBands: [],
      baseBand: "BAND_A_10PCS",
      basePriceUsdCents: 0,
      surchargeUsdCents: 0,
      totalUsdCents: 0,
    };
  }

  const priced = bands.map((b) => {
    const price = input.priceUsdCentsByBand.get(b);
    if (price == null) throw new Error(`Missing price for band ${b}`);
    return { band: b, price };
  });

  // base = max(band price)
  priced.sort((a, b) => b.price - a.price);
  const base = priced[0]!;
  const surcharge = bands.length > 1 ? surchargePerExtra * (bands.length - 1) : 0;
  return {
    distinctBands: bands,
    baseBand: base.band,
    basePriceUsdCents: base.price,
    surchargeUsdCents: surcharge,
    totalUsdCents: base.price + surcharge,
  };
}

