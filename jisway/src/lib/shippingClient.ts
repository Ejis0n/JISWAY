import type { CatalogVariant } from "@/lib/catalog";

export function shippingBandForVariant(v: Pick<CatalogVariant, "pack_qty">) {
  return v.pack_qty === 10 ? "BAND_A" : "BAND_B";
}

export function computeShippingUsd(input: { bands: Array<"BAND_A" | "BAND_B"> }) {
  const distinct = Array.from(new Set(input.bands));
  if (distinct.length === 0) return 0;
  const base = distinct.includes("BAND_B") ? 28 : 18;
  const surcharge = distinct.length > 1 ? 5 * (distinct.length - 1) : 0;
  return base + surcharge;
}

