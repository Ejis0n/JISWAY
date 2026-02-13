import { getCatalog } from "@/lib/catalog";
import { assertUniqueSeoSlugs, buildSeoSlug } from "@/lib/seo/slug";
import { metaDescription, seoTitle } from "@/lib/seo/templates";

function fail(msg: string): never {
  throw new Error(`SEO audit failed: ${msg}`);
}

function isSlugSafe(slug: string) {
  return /^[a-z0-9-]+$/.test(slug);
}

function main() {
  const catalog = getCatalog();

  assertUniqueSeoSlugs(catalog);

  const counts = new Map<string, number>();

  for (const v of catalog) {
    const slug = buildSeoSlug(v);
    if (!isSlugSafe(slug)) fail(`forbidden chars in slug: ${slug}`);

    const title = seoTitle(v);
    if (!title.includes("| JISWAY")) fail(`title missing brand: ${v.id}`);

    const desc = metaDescription(v);
    if (desc.length > 160) fail(`meta description too long (${desc.length}): ${v.id}`);

    const key = `${v.category}|${v.size}|${v.pack_qty}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  // eslint-disable-next-line no-console
  console.log(`OK: ${catalog.length} variants`);
  // eslint-disable-next-line no-console
  console.log("Counts (category|size|pack):");
  for (const [k, n] of Array.from(counts.entries()).sort()) {
    // eslint-disable-next-line no-console
    console.log(`- ${k}: ${n}`);
  }
}

main();

