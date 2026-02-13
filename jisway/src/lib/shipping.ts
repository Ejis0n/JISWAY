import type { ShippingBand, ShippingRate, Variant } from "@prisma/client";

export function bandForPackType(packType: Variant["packType"]): ShippingBand {
  return packType === "PACK_10" ? "BAND_A" : "BAND_B";
}

export function computeShippingUsdCents(input: {
  cartBands: ShippingBand[];
  rates: Pick<ShippingRate, "band" | "amountUsd">[];
}) {
  const rateMap = new Map<ShippingBand, number>(
    input.rates.map((r) => [r.band, r.amountUsd]),
  );
  const distinctBands = Array.from(new Set(input.cartBands));
  if (distinctBands.length === 0) return 0;

  const bandAmounts = distinctBands.map((b) => {
    const amt = rateMap.get(b);
    if (amt == null) throw new Error(`Missing shipping rate for band ${b}`);
    return amt;
  });

  const max = Math.max(...bandAmounts);
  const surcharge = distinctBands.length > 1 ? 500 * (distinctBands.length - 1) : 0; // $5 per additional band group
  return max + surcharge;
}

