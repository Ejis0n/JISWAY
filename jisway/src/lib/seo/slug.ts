import type { CatalogVariant } from "@/lib/catalog";

export type SeoSlug = string;

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function strengthToSlug(strength: string) {
  return normalize(strength).replaceAll(".", "-");
}

function finishToSlug(finish: string) {
  return normalize(finish).replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-+|-+$/g, "");
}

export function buildSeoSlug(v: Pick<
  CatalogVariant,
  "category" | "size" | "length_mm" | "strength_class" | "finish" | "pack_qty"
>): SeoSlug {
  const size = normalize(v.size);
  const finish = finishToSlug(v.finish);
  const pack = `${v.pack_qty}pcs`;

  if (v.category === "bolt") {
    if (!v.length_mm) throw new Error("Bolt requires length_mm");
    const strength = strengthToSlug(v.strength_class ?? "8.8");
    const base = `jis-bolt-${size}x${v.length_mm}-${strength}-${finish}-${pack}`;
    if (!/^[a-z0-9-]+$/.test(base)) throw new Error(`Invalid slug chars: ${base}`);
    return base;
  }

  if (v.category === "nut") {
    const base = `jis-nut-${size}-${finish}-${pack}`;
    if (!/^[a-z0-9-]+$/.test(base)) throw new Error(`Invalid slug chars: ${base}`);
    return base;
  }

  const base = `jis-washer-${size}-${finish}-${pack}`;
  if (!/^[a-z0-9-]+$/.test(base)) throw new Error(`Invalid slug chars: ${base}`);
  return base;
}

export function assertUniqueSeoSlugs(variants: CatalogVariant[]) {
  const seen = new Map<string, string>();
  for (const v of variants) {
    const slug = buildSeoSlug(v);
    const prev = seen.get(slug);
    if (prev) throw new Error(`Duplicate seo slug: ${slug} (ids: ${prev}, ${v.id})`);
    seen.set(slug, v.id);
  }
  return true;
}

