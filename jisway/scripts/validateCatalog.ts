import { loadCatalogFromDisk, validateCatalog } from "@/lib/catalog";

// CLI
if (require.main === module) {
  const catalog = loadCatalogFromDisk(process.argv[2]);
  validateCatalog(catalog);
  // eslint-disable-next-line no-console
  console.log(`OK: ${catalog.length} variants validated.`);
}

