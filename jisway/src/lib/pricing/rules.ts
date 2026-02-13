import type { CatalogCategory } from "@/lib/catalog";

export type PricingInput = {
  category: CatalogCategory;
  size: string; // "M3".."M24"
  length_mm: number | null;
  strength_class: string | null;
  finish: string;
  pack_qty: number;
  subtype?: string | null;
};

function sizeNumber(size: string) {
  const m = /^M(\d+)$/.exec(size.trim().toUpperCase());
  if (!m) throw new Error(`Invalid size: ${size}`);
  return Number(m[1]);
}

function finishMultiplier(finish: string) {
  const f = finish.trim().toLowerCase();
  if (f === "zinc") return 1.0;
  if (f === "plain") return 0.95;
  if (f === "stainless") return 1.6;
  return 1.15;
}

function strengthMultiplier(strength: string | null) {
  if (!strength) return 1.0;
  const s = strength.trim();
  if (s === "8.8") return 1.0;
  if (s === "10.9") return 1.15;
  return 1.05;
}

function packMultiplier(packQty: number) {
  // Discount curve: bigger packs are cheaper than linear.
  // 10->1.00, 20->~1.87, 50->~4.26, 100->~7.94
  const base = Math.max(1, packQty) / 10;
  return Math.pow(base, 0.9);
}

function boltBase10Usd(size: number, length: number) {
  // Tuned to be in the same ballpark as v0 (integer USD)
  return 2.0 + size * 0.35 + length * 0.03;
}

function nutBase10Usd(size: number, subtype?: string | null) {
  const t = (subtype ?? "hex").toLowerCase();
  const typeMult = t === "hex" ? 1.0 : 1.15;
  return (2.2 + size * 0.28) * typeMult;
}

function washerBase10Usd(size: number, subtype?: string | null) {
  const t = (subtype ?? "flat").toLowerCase();
  const typeMult = t === "flat" ? 1.0 : 1.1;
  return (2.0 + size * 0.15) * typeMult;
}

export function priceUsdForVariant(input: PricingInput) {
  const s = sizeNumber(input.size);
  const finishMult = finishMultiplier(input.finish);
  const strengthMult = strengthMultiplier(input.strength_class);
  const packMult = packMultiplier(input.pack_qty);

  let base10 = 1;
  if (input.category === "bolt") {
    const len = input.length_mm ?? 0;
    if (!len) throw new Error("Bolt requires length_mm");
    base10 = boltBase10Usd(s, len);
  } else if (input.category === "nut") {
    base10 = nutBase10Usd(s, input.subtype);
  } else {
    base10 = washerBase10Usd(s, input.subtype);
  }

  const raw = base10 * finishMult * strengthMult * packMult;
  const rounded = Math.max(1, Math.round(raw));
  return rounded;
}

