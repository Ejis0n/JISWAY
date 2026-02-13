import type { SupplierOffer, SupplierAvailability, ProductCategory, Variant, Product } from "@prisma/client";

export type OrderLineSpec = {
  variantId: string;
  category: ProductCategory;
  size: string;
  length_mm: number | null;
  strength_class: string | null;
  finish: string;
  pack_qty: number;
};

export type MatchQuality = "exact" | "partial" | "fallback" | "none";

export type MatchedOffer = {
  offer: SupplierOffer;
  match_quality: MatchQuality;
  match_score: number; // exact=1.0, partial=0.6, fallback=0.3
  matched_by: string;
};

function availabilityScore(a: SupplierAvailability) {
  if (a === "in_stock") return 1.0;
  if (a === "limited") return 0.7;
  if (a === "backorder") return 0.2;
  return 0.4;
}

function isOfferWildcardMatch(line: OrderLineSpec, offer: SupplierOffer) {
  if (offer.category != null && offer.category !== line.category) return false;
  if (offer.size != null && offer.size.toUpperCase() !== line.size.toUpperCase()) return false;
  if (offer.lengthMm != null && offer.lengthMm !== (line.length_mm ?? null)) return false;
  if (offer.finish != null && offer.finish.toLowerCase() !== line.finish.toLowerCase()) return false;
  if (offer.strengthClass != null && offer.strengthClass !== (line.strength_class ?? null)) return false;
  if (offer.packQty != null && offer.packQty !== line.pack_qty) return false;
  return true;
}

export function matchSupplierOffers(input: {
  line: OrderLineSpec;
  offers: SupplierOffer[];
}): MatchedOffer[] {
  const { line, offers } = input;

  // 1) exact: variantId + packQty
  const exact = offers
    .filter((o) => o.variantId === line.variantId && (o.packQty == null || o.packQty === line.pack_qty))
    .map((offer) => ({
      offer,
      match_quality: "exact" as const,
      match_score: 1.0,
      matched_by: "variant_id",
    }));

  // 2) wildcard spec match (nullable fields are wildcards)
  const partial = offers
    .filter((o) => o.variantId == null)
    .filter((o) => isOfferWildcardMatch(line, o))
    .map((offer) => ({
      offer,
      match_quality: "partial" as const,
      match_score: 0.6,
      matched_by: "spec_wildcards",
    }));

  // 3) category+size+packQty (explicit)
  const catSizePack = offers
    .filter((o) => o.variantId == null)
    .filter((o) => o.category === line.category && o.size?.toUpperCase() === line.size.toUpperCase())
    .filter((o) => o.packQty == null || o.packQty === line.pack_qty)
    .map((offer) => ({
      offer,
      match_quality: "partial" as const,
      match_score: 0.6,
      matched_by: "category_size_pack",
    }));

  // 4) fallback: supplier default (category only or no spec) -> low confidence
  const fallback = offers
    .filter((o) => o.variantId == null)
    .filter((o) => (o.category == null || o.category === line.category) && o.size == null)
    .filter((o) => o.packQty == null || o.packQty === line.pack_qty)
    .map((offer) => ({
      offer,
      match_quality: "fallback" as const,
      match_score: 0.3,
      matched_by: "supplier_default",
    }));

  const all = [...exact, ...partial, ...catSizePack, ...fallback];

  // De-dup by offer.id and sort deterministic: quality desc, availability desc, updatedAt desc
  const seen = new Set<string>();
  const uniq = all.filter((m) => {
    if (seen.has(m.offer.id)) return false;
    seen.add(m.offer.id);
    return true;
  });

  uniq.sort((a, b) => {
    const q = b.match_score - a.match_score;
    if (q !== 0) return q;
    const av = availabilityScore(b.offer.availability) - availabilityScore(a.offer.availability);
    if (av !== 0) return av;
    return b.offer.updatedAt.getTime() - a.offer.updatedAt.getTime();
  });

  return uniq;
}

export function lineSpecFromVariant(input: {
  variant: Variant & { product: Product };
  pack_qty: number;
}): OrderLineSpec {
  return {
    variantId: input.variant.id,
    category: input.variant.product.category,
    size: input.variant.product.size,
    length_mm: input.variant.product.length ?? null,
    strength_class: input.variant.product.strengthClass ?? null,
    finish: input.variant.product.finish,
    pack_qty: input.pack_qty,
  };
}

