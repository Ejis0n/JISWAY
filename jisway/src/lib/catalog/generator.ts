import fs from "node:fs";
import path from "node:path";
import type { CatalogCategory, CatalogVariant } from "@/lib/catalog";
import { priceUsdForVariant } from "@/lib/pricing/rules";

export type CatalogConfig = {
  standard: "JIS";
  targetCount?: number;
  sizes_mm: number[];
  images: Record<CatalogCategory, string>;
  bolts: {
    lengths_default_mm: number[];
    lengths_by_size_mm?: Record<string, number[]>;
    strength_classes: string[];
    finishes: string[];
    pack_qty: number[];
  };
  nuts: {
    types: string[];
    finishes: string[];
    pack_qty: number[];
  };
  washers: {
    types: string[];
    finishes: string[];
    pack_qty: number[];
  };
};

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function strengthToSlug(strength: string) {
  return normalize(strength).replaceAll(".", "-");
}

function finishToSlug(finish: string) {
  return normalize(finish).replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-+|-+$/g, "");
}

function typeToSlug(t: string) {
  return normalize(t).replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-+|-+$/g, "");
}

function isSlugSafe(s: string) {
  return /^[a-z0-9-]+$/.test(s);
}

function sizeStr(mm: number) {
  return `M${mm}`;
}

function compareVariant(a: CatalogVariant, b: CatalogVariant) {
  const c = a.category.localeCompare(b.category);
  if (c !== 0) return c;
  const sa = Number(a.size.slice(1));
  const sb = Number(b.size.slice(1));
  if (sa !== sb) return sa - sb;
  const la = a.length_mm ?? 0;
  const lb = b.length_mm ?? 0;
  if (la !== lb) return la - lb;
  const stra = a.strength_class ?? "";
  const strb = b.strength_class ?? "";
  const stc = stra.localeCompare(strb);
  if (stc !== 0) return stc;
  const fc = a.finish.localeCompare(b.finish);
  if (fc !== 0) return fc;
  return a.pack_qty - b.pack_qty;
}

function buildVariantId(input: {
  category: CatalogCategory;
  size: string;
  length_mm: number | null;
  strength_class: string | null;
  finish: string;
  pack_qty: number;
  subtype?: string | null;
}) {
  const size = normalize(input.size);
  const finish = finishToSlug(input.finish);
  const pack = `${input.pack_qty}pcs`;

  if (input.category === "bolt") {
    const strength = strengthToSlug(input.strength_class ?? "8.8");
    if (!input.length_mm) throw new Error("Bolt requires length_mm");
    const id = `bolt-${size}x${input.length_mm}-${strength}-${finish}-${pack}`;
    if (!isSlugSafe(id)) throw new Error(`Bad id: ${id}`);
    return id;
  }

  const t = typeToSlug(input.subtype ?? (input.category === "nut" ? "hex" : "flat"));
  const id = `${input.category}-${t}-${size}-${finish}-${pack}`;
  if (!isSlugSafe(id)) throw new Error(`Bad id: ${id}`);
  return id;
}

export function generateCatalogVariants(config: CatalogConfig) {
  const out: CatalogVariant[] = [];
  const standard = config.standard ?? "JIS";
  const sizes = config.sizes_mm.map(sizeStr);

  // bolts
  for (const size of sizes) {
    const lengths =
      config.bolts.lengths_by_size_mm?.[size] ?? config.bolts.lengths_default_mm ?? [];
    for (const length_mm of lengths) {
      for (const strength_class of config.bolts.strength_classes) {
        for (const finish of config.bolts.finishes) {
          for (const pack_qty of config.bolts.pack_qty) {
            const v: CatalogVariant = {
              id: buildVariantId({
                category: "bolt",
                size,
                length_mm,
                strength_class,
                finish,
                pack_qty,
              }),
              category: "bolt",
              standard,
              size,
              length_mm,
              strength_class,
              finish,
              pack_qty: pack_qty as CatalogVariant["pack_qty"],
              price_usd: 1,
              image_url: config.images.bolt,
            };
            v.price_usd = priceUsdForVariant({
              category: v.category,
              size: v.size,
              length_mm: v.length_mm,
              strength_class: v.strength_class,
              finish: v.finish,
              pack_qty: v.pack_qty,
            });
            out.push(v);
          }
        }
      }
    }
  }

  // nuts
  for (const size of sizes) {
    for (const subtype of config.nuts.types) {
      for (const finish of config.nuts.finishes) {
        for (const pack_qty of config.nuts.pack_qty) {
          const v: CatalogVariant = {
            id: buildVariantId({
              category: "nut",
              size,
              length_mm: null,
              strength_class: null,
              finish,
              pack_qty,
              subtype,
            }),
            category: "nut",
            standard,
            size,
            length_mm: null,
            strength_class: null,
            finish,
            pack_qty: pack_qty as CatalogVariant["pack_qty"],
            price_usd: 1,
            image_url: config.images.nut,
          };
          v.price_usd = priceUsdForVariant({
            category: v.category,
            size: v.size,
            length_mm: v.length_mm,
            strength_class: v.strength_class,
            finish: v.finish,
            pack_qty: v.pack_qty,
            subtype,
          });
          out.push(v);
        }
      }
    }
  }

  // washers
  for (const size of sizes) {
    for (const subtype of config.washers.types) {
      for (const finish of config.washers.finishes) {
        for (const pack_qty of config.washers.pack_qty) {
          const v: CatalogVariant = {
            id: buildVariantId({
              category: "washer",
              size,
              length_mm: null,
              strength_class: null,
              finish,
              pack_qty,
              subtype,
            }),
            category: "washer",
            standard,
            size,
            length_mm: null,
            strength_class: null,
            finish,
            pack_qty: pack_qty as CatalogVariant["pack_qty"],
            price_usd: 1,
            image_url: config.images.washer,
          };
          v.price_usd = priceUsdForVariant({
            category: v.category,
            size: v.size,
            length_mm: v.length_mm,
            strength_class: v.strength_class,
            finish: v.finish,
            pack_qty: v.pack_qty,
            subtype,
          });
          out.push(v);
        }
      }
    }
  }

  out.sort(compareVariant);

  const capped =
    config.targetCount && config.targetCount > 0 ? out.slice(0, config.targetCount) : out;

  // Uniqueness check (id)
  const seen = new Set<string>();
  for (const v of capped) {
    if (seen.has(v.id)) throw new Error(`Duplicate id: ${v.id}`);
    seen.add(v.id);
  }

  return capped;
}

export function loadCatalogConfigFromDisk(p?: string) {
  const file = p ?? path.join(process.cwd(), "data", "catalog.config.json");
  const raw = fs.readFileSync(file, "utf-8");
  return JSON.parse(raw) as CatalogConfig;
}

export function writeGeneratedCatalogToDisk(variants: CatalogVariant[], outPath?: string) {
  const file = outPath ?? path.join(process.cwd(), "data", "catalog.generated.json");
  fs.writeFileSync(file, JSON.stringify(variants, null, 2) + "\n", "utf-8");
  return file;
}

