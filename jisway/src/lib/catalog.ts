import fs from "node:fs";
import path from "node:path";
import { buildSeoSlug } from "@/lib/seo/slug";

export type CatalogCategory = "bolt" | "nut" | "washer";

export type CatalogVariant = {
  id: string;
  category: CatalogCategory;
  standard: "JIS";
  size: string;
  length_mm: number | null;
  strength_class: string | null;
  finish: string;
  pack_qty: 10 | 20 | 50 | 100;
  price_usd: number;
  image_url: string;
};

function fail(message: string): never {
  throw new Error(`Catalog validation failed: ${message}`);
}

export function isSlugSafe(id: string) {
  return /^[a-z0-9](?:[a-z0-9x-]*[a-z0-9])?$/.test(id);
}

export function isSize(size: string) {
  return /^M(?:[3-9]|1\d|2[0-4])$/.test(size);
}

export function validateCatalog(catalog: CatalogVariant[]) {
  if (!Array.isArray(catalog)) fail("catalog must be an array");
  if (catalog.length < 1) fail("catalog must not be empty");

  const ids = new Set<string>();

  for (const [idx, v] of catalog.entries()) {
    if (!v || typeof v !== "object") fail(`entry ${idx} must be an object`);
    if (typeof v.id !== "string" || v.id.trim() === "") fail(`entry ${idx} missing id`);
    if (!isSlugSafe(v.id)) fail(`entry ${idx} id not slug-safe: ${v.id}`);
    if (ids.has(v.id)) fail(`duplicate id: ${v.id}`);
    ids.add(v.id);

    if (v.standard !== "JIS") fail(`id=${v.id} standard must be "JIS"`);
    if (typeof v.finish !== "string" || v.finish.trim() === "")
      fail(`id=${v.id} finish required`);
    if (!isSize(v.size)) fail(`id=${v.id} size invalid: ${v.size}`);
    if (![10, 20, 50, 100].includes(v.pack_qty)) fail(`id=${v.id} pack_qty invalid`);

    if (!Number.isFinite(v.price_usd)) fail(`id=${v.id} price_usd must be a finite number`);
    if (v.price_usd <= 0) fail(`id=${v.id} price_usd must be > 0`);
    if (!Number.isInteger(v.price_usd))
      fail(`id=${v.id} price_usd must be rounded .00 (integer), got ${v.price_usd}`);

    if (typeof v.image_url !== "string" || v.image_url.trim() === "")
      fail(`id=${v.id} image_url required`);

    if (v.category === "bolt") {
      if (!v.strength_class || v.strength_class.trim() === "")
        fail(`id=${v.id} bolt strength_class required`);
      if (typeof v.length_mm !== "number" || !Number.isInteger(v.length_mm) || v.length_mm <= 0)
        fail(`id=${v.id} bolt length_mm must be positive integer`);
    } else if (v.category === "nut") {
      if (v.length_mm !== null) fail(`id=${v.id} nut length_mm must be null`);
      if (v.strength_class !== null) fail(`id=${v.id} nut strength_class must be null`);
    } else if (v.category === "washer") {
      if (v.length_mm !== null) fail(`id=${v.id} washer length_mm must be null`);
      if (v.strength_class !== null) fail(`id=${v.id} washer strength_class must be null`);
    } else {
      fail(`id=${v.id} invalid category`);
    }
  }

  return true;
}

export function loadCatalogFromDisk(catalogPath?: string) {
  const defaultGenerated = path.join(process.cwd(), "data", "catalog.generated.json");
  const defaultV0 = path.join(process.cwd(), "data", "catalog.v0.json");
  const p =
    catalogPath ??
    (fs.existsSync(defaultGenerated) ? defaultGenerated : defaultV0);
  const raw = fs.readFileSync(p, "utf-8");
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) fail("catalog json root must be an array");
  return parsed as CatalogVariant[];
}

let memo: CatalogVariant[] | null = null;
let memoSeoSlugIndex: Map<string, CatalogVariant> | null = null;
export function getCatalog() {
  if (memo) return memo;
  const catalog = loadCatalogFromDisk();
  validateCatalog(catalog);
  memo = catalog;
  memoSeoSlugIndex = new Map(
    catalog.map((v) => [`${v.category}:${buildSeoSlug(v)}`, v]),
  );
  return catalog;
}

export function getVariantById(id: string) {
  const catalog = getCatalog();
  return catalog.find((v) => v.id === id) ?? null;
}

export function getVariantBySeoSlug(category: CatalogCategory, seoSlug: string) {
  // ensure memo is built
  getCatalog();
  return memoSeoSlugIndex?.get(`${category}:${seoSlug}`) ?? null;
}

export function getVariantsByCategory(category: CatalogCategory) {
  const catalog = getCatalog();
  return catalog.filter((v) => v.category === category);
}

