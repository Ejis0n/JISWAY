import type { CatalogVariant } from "@/lib/catalog";
import { buildSeoSlug } from "@/lib/seo/slug";
import { seoTitle } from "@/lib/seo/templates";

function urlFor(v: CatalogVariant) {
  return `/jis/${v.category}/${buildSeoSlug(v)}`;
}

function sameSpec(a: CatalogVariant, b: CatalogVariant) {
  return (
    a.category === b.category &&
    a.size === b.size &&
    (a.length_mm ?? null) === (b.length_mm ?? null) &&
    (a.strength_class ?? null) === (b.strength_class ?? null) &&
    a.finish === b.finish
  );
}

function pickPreferredPack(list: CatalogVariant[]) {
  const p20 = list.find((x) => x.pack_qty === 20);
  return p20 ?? list[0] ?? null;
}

export function internalLinks(variant: CatalogVariant, catalog: CatalogVariant[]) {
  const siblingPackCandidate = catalog.find(
    (v) => v.id !== variant.id && sameSpec(v, variant) && v.pack_qty !== variant.pack_qty,
  );

  const nuts = catalog.filter((v) => v.category === "nut" && v.size === variant.size);
  const washers = catalog.filter((v) => v.category === "washer" && v.size === variant.size);

  const matchingNut = pickPreferredPack(nuts);
  const matchingWasher = pickPreferredPack(washers);

  return {
    siblingPack: siblingPackCandidate
      ? { title: seoTitle(siblingPackCandidate), url: urlFor(siblingPackCandidate) }
      : undefined,
    matchingNut: matchingNut ? { title: seoTitle(matchingNut), url: urlFor(matchingNut) } : undefined,
    matchingWasher: matchingWasher
      ? { title: seoTitle(matchingWasher), url: urlFor(matchingWasher) }
      : undefined,
    hubs: {
      sizeHubUrl: `/jis/${variant.category}/${variant.size.toLowerCase()}`,
      categoryUrl: `/jis/${variant.category}`,
      catalogUrl: `/jis`,
    },
  };
}

