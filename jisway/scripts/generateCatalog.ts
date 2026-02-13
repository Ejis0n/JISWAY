import {
  generateCatalogVariants,
  loadCatalogConfigFromDisk,
  writeGeneratedCatalogToDisk,
} from "@/lib/catalog/generator";

function main() {
  const cfgPath = process.argv[2]; // optional
  const outPath = process.argv[3]; // optional
  const config = loadCatalogConfigFromDisk(cfgPath);
  const variants = generateCatalogVariants(config);
  const p = writeGeneratedCatalogToDisk(variants, outPath);
  // eslint-disable-next-line no-console
  console.log(`OK: generated ${variants.length} variants -> ${p}`);
}

main();

