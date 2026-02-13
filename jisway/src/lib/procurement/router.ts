import type { Supplier, SupplierOffer, RoutingStrategy } from "@prisma/client";
import type { MatchedOffer, OrderLineSpec } from "@/lib/procurement/match";

export type RoutingLineInput = {
  lineId: string; // stable for UI
  spec: OrderLineSpec;
  qty_packs: number;
  candidates: MatchedOffer[];
};

export type BalancedWeights = {
  cost: number;
  lead: number;
  availability: number;
  match: number;
};

export type SupplierScoreBreakdown = {
  supplier_id: string;
  offer_id: string;
  match_quality: string;
  match_score: number;
  availability: string;
  availability_score: number;
  lead_time_days: number | null;
  lead_score: number;
  unit_cost_jpy: number;
  min_order_packs: number;
  effective_packs: number;
  estimated_cost_jpy: number;
  cost_score: number;
  final_score: number;
};

export type RoutingLineDecision = {
  lineId: string;
  variantId: string;
  qty_packs: number;
  chosen_supplier_id: string | null;
  chosen_offer_id: string | null;
  needs_manual_assignment: boolean;
  reason_text: string;
  score_json: {
    strategy: RoutingStrategy;
    weights?: BalancedWeights;
    candidates: SupplierScoreBreakdown[];
  };
};

export type RoutingResult = {
  decisions: RoutingLineDecision[];
  bySupplier: Array<{
    supplierId: string;
    total_packs: number;
    estimated_cost_jpy: number;
    lead_time_days_estimate: number | null;
    lines: Array<{ lineId: string; variantId: string; qty_packs: number; offer_id: string }>;
  }>;
  needsAssignment: Array<{ lineId: string; variantId: string; qty_packs: number }>;
};

function availabilityScore(a: string) {
  if (a === "in_stock") return 1.0;
  if (a === "limited") return 0.7;
  if (a === "backorder") return 0.2;
  return 0.4;
}

function normalizeInverse(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 1.0);
  return values.map((v) => 1.0 - (v - min) / (max - min));
}

function normalizeDirect(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 1.0);
  return values.map((v) => (v - min) / (max - min));
}

function pickOfferPerSupplier(candidates: MatchedOffer[]) {
  // For each supplier, keep best offer by match_score then updatedAt
  const by = new Map<string, MatchedOffer>();
  for (const c of candidates) {
    const sid = c.offer.supplierId;
    const prev = by.get(sid);
    if (!prev) {
      by.set(sid, c);
      continue;
    }
    if (c.match_score > prev.match_score) by.set(sid, c);
    else if (c.match_score === prev.match_score && c.offer.updatedAt > prev.offer.updatedAt) by.set(sid, c);
  }
  return Array.from(by.values());
}

export function routeProcurement(input: {
  lines: RoutingLineInput[];
  strategy: RoutingStrategy;
  weights?: BalancedWeights;
}): RoutingResult {
  const weights: BalancedWeights = input.weights ?? { cost: 0.5, lead: 0.3, availability: 0.2, match: 0.1 };

  const decisions: RoutingLineDecision[] = [];
  const supplierAgg = new Map<
    string,
    { supplierId: string; total_packs: number; estimated_cost_jpy: number; lead_times: number[]; lines: any[] }
  >();
  const needsAssignment: RoutingResult["needsAssignment"] = [];

  for (const line of input.lines) {
    const cand = pickOfferPerSupplier(line.candidates);
    if (cand.length === 0) {
      decisions.push({
        lineId: line.lineId,
        variantId: line.spec.variantId,
        qty_packs: line.qty_packs,
        chosen_supplier_id: null,
        chosen_offer_id: null,
        needs_manual_assignment: true,
        reason_text: "No candidates. Needs manual assignment.",
        score_json: { strategy: input.strategy, weights, candidates: [] },
      });
      needsAssignment.push({ lineId: line.lineId, variantId: line.spec.variantId, qty_packs: line.qty_packs });
      continue;
    }

    const estimatedCosts = cand.map((c) => {
      const eff = Math.max(line.qty_packs, c.offer.minOrderPacks ?? 1);
      return (c.offer.unitCostJpy ?? 0) * eff;
    });
    const leads = cand.map((c) => c.offer.leadTimeDays ?? 999);
    const avs = cand.map((c) => availabilityScore(String(c.offer.availability)));
    const matchScores = cand.map((c) => c.match_score);

    const costScore = normalizeInverse(estimatedCosts);
    const leadScore = normalizeInverse(leads);
    const matchNorm = normalizeDirect(matchScores); // higher better

    const breakdown: SupplierScoreBreakdown[] = cand.map((c, i) => {
      const eff = Math.max(line.qty_packs, c.offer.minOrderPacks ?? 1);
      const est = (c.offer.unitCostJpy ?? 0) * eff;
      const av = availabilityScore(String(c.offer.availability));
      const base = {
        supplier_id: c.offer.supplierId,
        offer_id: c.offer.id,
        match_quality: c.match_quality,
        match_score: c.match_score,
        availability: String(c.offer.availability),
        availability_score: av,
        lead_time_days: c.offer.leadTimeDays ?? null,
        lead_score: leadScore[i],
        unit_cost_jpy: c.offer.unitCostJpy,
        min_order_packs: c.offer.minOrderPacks,
        effective_packs: eff,
        estimated_cost_jpy: est,
        cost_score: costScore[i],
        final_score: 0,
      };

      let final = 0;
      if (input.strategy === "CHEAPEST") final = base.cost_score;
      else if (input.strategy === "FASTEST") final = base.lead_score;
      else if (input.strategy === "AVAILABILITY_FIRST") final = base.availability_score;
      else {
        final =
          weights.cost * base.cost_score +
          weights.lead * base.lead_score +
          weights.availability * base.availability_score +
          weights.match * matchNorm[i];
      }

      return { ...base, final_score: Number(final.toFixed(6)) };
    });

    breakdown.sort((a, b) => b.final_score - a.final_score);
    const chosen = breakdown[0];

    const reason =
      input.strategy === "CHEAPEST"
        ? `Chosen: supplier ${chosen.supplier_id} (lowest estimated cost).`
        : input.strategy === "FASTEST"
          ? `Chosen: supplier ${chosen.supplier_id} (fastest lead time).`
          : input.strategy === "AVAILABILITY_FIRST"
            ? `Chosen: supplier ${chosen.supplier_id} (best availability).`
            : `Chosen: supplier ${chosen.supplier_id} (best balanced score).`;

    decisions.push({
      lineId: line.lineId,
      variantId: line.spec.variantId,
      qty_packs: line.qty_packs,
      chosen_supplier_id: chosen.supplier_id,
      chosen_offer_id: chosen.offer_id,
      needs_manual_assignment: false,
      reason_text: reason,
      score_json: {
        strategy: input.strategy,
        weights: input.strategy === "BALANCED" ? weights : undefined,
        candidates: breakdown,
      },
    });

    const agg =
      supplierAgg.get(chosen.supplier_id) ??
      { supplierId: chosen.supplier_id, total_packs: 0, estimated_cost_jpy: 0, lead_times: [], lines: [] };
    agg.total_packs += line.qty_packs;
    agg.estimated_cost_jpy += chosen.estimated_cost_jpy;
    if (chosen.lead_time_days != null) agg.lead_times.push(chosen.lead_time_days);
    agg.lines.push({ lineId: line.lineId, variantId: line.spec.variantId, qty_packs: line.qty_packs, offer_id: chosen.offer_id });
    supplierAgg.set(chosen.supplier_id, agg);
  }

  const bySupplier = Array.from(supplierAgg.values()).map((x) => ({
    supplierId: x.supplierId,
    total_packs: x.total_packs,
    estimated_cost_jpy: x.estimated_cost_jpy,
    lead_time_days_estimate: x.lead_times.length ? Math.max(...x.lead_times) : null,
    lines: x.lines,
  }));

  return { decisions, bySupplier, needsAssignment };
}

