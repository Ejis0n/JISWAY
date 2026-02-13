import fs from "node:fs";
import path from "node:path";
import { assertUniqueSeoSlugs } from "@/lib/seo/slug";
import type { CatalogVariant } from "@/lib/catalog";

function fail(msg: string): never {
  throw new Error(`Catalog audit failed: ${msg}`);
}

function isIdSafe(id: string) {
  return /^[a-z0-9-]+$/.test(id);
}

function readCatalog(p?: string) {
  const file = p ?? path.join(process.cwd(), "data", "catalog.generated.json");
  const raw = fs.readFileSync(file, "utf-8");
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) fail("catalog must be an array");
  return parsed as CatalogVariant[];
}

function main() {
  const p = process.argv[2];
  const catalog = readCatalog(p);
  if (catalog.length < 500) fail(`expected >= 500 variants, got ${catalog.length}`);

  const ids = new Set<string>();
  for (const [idx, v] of catalog.entries()) {
    if (!v || typeof v !== "object") fail(`entry ${idx} must be object`);
    if (typeof v.id !== "string" || !v.id.trim()) fail(`entry ${idx} missing id`);
    if (!isIdSafe(v.id)) fail(`id has forbidden chars: ${v.id}`);
    if (ids.has(v.id)) fail(`duplicate id: ${v.id}`);
    ids.add(v.id);

    if (v.standard !== "JIS") fail(`id=${v.id} standard must be JIS`);
    if (!/^M\d+$/.test(v.size)) fail(`id=${v.id} invalid size ${v.size}`);
    if (v.category === "bolt") {
      if (!v.length_mm) fail(`id=${v.id} bolt requires length_mm`);
      if (!v.strength_class) fail(`id=${v.id} bolt requires strength_class`);
    } else {
      if (v.length_mm !== null) fail(`id=${v.id} non-bolt length_mm must be null`);
      if (v.strength_class !== null) fail(`id=${v.id} non-bolt strength_class must be null`);
    }
    if (!Number.isFinite(v.price_usd) || !Number.isInteger(v.price_usd) || v.price_usd <= 0) {
      fail(`id=${v.id} invalid price_usd: ${String(v.price_usd)}`);
    }
    if (typeof v.image_url !== "string" || !v.image_url.trim()) fail(`id=${v.id} missing image_url`);
    if (typeof v.finish !== "string" || !v.finish.trim()) fail(`id=${v.id} missing finish`);
    if (![10, 20, 50, 100].includes(v.pack_qty)) fail(`id=${v.id} invalid pack_qty ${v.pack_qty}`);
  }

  assertUniqueSeoSlugs(catalog);

  // eslint-disable-next-line no-console
  console.log(`OK: audited ${catalog.length} variants`);
}

main();

