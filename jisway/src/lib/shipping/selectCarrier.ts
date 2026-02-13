import type {
  CarrierPolicy,
  CarrierPolicyType,
  ShippingCarrier,
  ShippingRule,
  ShippingRuleBand,
} from "@prisma/client";
import { computeFlatBandShippingUsdCents, distinctBands } from "@/lib/shipping/bands";

export type CarrierCandidate = {
  carrier: ShippingCarrier;
  shippingPriceUsdCents: number;
  etaMinDays: number;
  etaMaxDays: number;
  trackingIncluded: boolean;
  bandBreakdown: ReturnType<typeof computeFlatBandShippingUsdCents>;
};

function carrierNameFallbackByZone(zoneName: string): ShippingCarrier {
  // Spec: DEFAULT => JP_POST for ASEAN/NA/EU, DHL for Oceania
  return zoneName === "Oceania" ? "DHL" : "JP_POST";
}

export function buildCandidates(input: {
  zoneName: string;
  bands: ShippingRuleBand[];
  rules: Pick<ShippingRule, "band" | "carrier" | "priceUsdCents" | "etaMinDays" | "etaMaxDays" | "trackingIncluded">[];
}): CarrierCandidate[] {
  const requiredBands = distinctBands(input.bands);
  const byCarrier = new Map<ShippingCarrier, Map<ShippingRuleBand, (typeof input.rules)[number]>>();

  for (const r of input.rules) {
    if (!byCarrier.has(r.carrier)) byCarrier.set(r.carrier, new Map());
    byCarrier.get(r.carrier)!.set(r.band, r);
  }

  const candidates: CarrierCandidate[] = [];
  for (const [carrier, bandMap] of byCarrier.entries()) {
    const missing = requiredBands.filter((b) => !bandMap.has(b));
    if (missing.length > 0) continue;

    const priceByBand = new Map<ShippingRuleBand, number>();
    for (const b of requiredBands) priceByBand.set(b, bandMap.get(b)!.priceUsdCents);
    const bandBreakdown = computeFlatBandShippingUsdCents({ bands: requiredBands, priceUsdCentsByBand: priceByBand });

    const etaMin = Math.max(...requiredBands.map((b) => bandMap.get(b)!.etaMinDays));
    const etaMax = Math.max(...requiredBands.map((b) => bandMap.get(b)!.etaMaxDays));
    const tracking = requiredBands.every((b) => bandMap.get(b)!.trackingIncluded);

    candidates.push({
      carrier,
      shippingPriceUsdCents: bandBreakdown.totalUsdCents,
      etaMinDays: etaMin,
      etaMaxDays: etaMax,
      trackingIncluded: tracking,
      bandBreakdown,
    });
  }

  return candidates;
}

export type SelectCarrierInput = {
  zoneName: string;
  bands: ShippingRuleBand[];
  subtotalUsdCents: number;
  weightKg: number;
  policy: Pick<
    CarrierPolicy,
    "policy" | "defaultCarrier" | "forceDhlOverWeightKg" | "forceDhlOverSubtotalUsdCents"
  > | null;
  rules: Pick<ShippingRule, "band" | "carrier" | "priceUsdCents" | "etaMinDays" | "etaMaxDays" | "trackingIncluded">[];
};

export type SelectCarrierResult = CarrierCandidate & {
  appliedPolicy: CarrierPolicyType;
  forcedDhl: boolean;
  forcedReason: "weight" | "subtotal" | null;
};

export function selectCarrier(input: SelectCarrierInput): SelectCarrierResult {
  const candidates = buildCandidates({
    zoneName: input.zoneName,
    bands: input.bands,
    rules: input.rules,
  });
  if (candidates.length === 0) {
    throw new Error(`No shipping rules available for zone=${input.zoneName}`);
  }

  const policyType = input.policy?.policy ?? "DEFAULT";
  const forceWeight = input.policy?.forceDhlOverWeightKg ?? null;
  const forceSubtotal = input.policy?.forceDhlOverSubtotalUsdCents ?? null;

  const forcedByWeight = forceWeight != null && input.weightKg > forceWeight;
  const forcedBySubtotal = forceSubtotal != null && input.subtotalUsdCents > forceSubtotal;
  const forcedDhl = forcedByWeight || forcedBySubtotal;
  const forcedReason = forcedByWeight ? "weight" : forcedBySubtotal ? "subtotal" : null;

  // Forced DHL wins if rule exists, otherwise fall back.
  if (forcedDhl) {
    const dhl = candidates.find((c) => c.carrier === "DHL");
    if (dhl) return { ...dhl, appliedPolicy: policyType, forcedDhl: true, forcedReason };
  }

  if (policyType === "CHEAPEST") {
    const best = [...candidates].sort((a, b) => a.shippingPriceUsdCents - b.shippingPriceUsdCents)[0]!;
    return { ...best, appliedPolicy: "CHEAPEST", forcedDhl: false, forcedReason: null };
  }

  if (policyType === "FASTEST") {
    const best = [...candidates].sort((a, b) => (a.etaMinDays - b.etaMinDays) || (a.shippingPriceUsdCents - b.shippingPriceUsdCents))[0]!;
    return { ...best, appliedPolicy: "FASTEST", forcedDhl: false, forcedReason: null };
  }

  // DEFAULT: prefer policy.defaultCarrier, else zone heuristic; fallback if missing.
  const preferred =
    input.policy?.defaultCarrier ??
    carrierNameFallbackByZone(input.zoneName);

  const direct = candidates.find((c) => c.carrier === preferred);
  if (direct) return { ...direct, appliedPolicy: "DEFAULT", forcedDhl: false, forcedReason: null };

  // fallback: any candidate
  return { ...candidates[0]!, appliedPolicy: "DEFAULT", forcedDhl: false, forcedReason: null };
}

