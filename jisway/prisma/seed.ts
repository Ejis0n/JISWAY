import "dotenv/config";
import { PrismaClient, type PackType, type ProductCategory } from "@prisma/client";
import bcrypt from "bcryptjs";
import { buildSpecKey } from "../src/lib/slug";
import { loadCatalogFromDisk, validateCatalog, type CatalogVariant } from "../src/lib/catalog";

const prisma = new PrismaClient();

function usd(amount: number) {
  return Math.round(amount * 100);
}

function packTypeForQty(packQty: CatalogVariant["pack_qty"]): PackType {
  if (packQty === 10) return "PACK_10";
  if (packQty === 20) return "PACK_20";
  if (packQty === 50) return "PACK_50";
  return "PACK_100";
}

function shippingBandForPackQty(packQty: CatalogVariant["pack_qty"]) {
  return packQty === 10 ? "BAND_A" : "BAND_B";
}

async function clearDevData() {
  if (process.env.NODE_ENV === "production") return;
  // Clear in dependency-safe order
  await prisma.stripeEvent.deleteMany();
  await prisma.appEvent.deleteMany();
  await prisma.analyticsEvent.deleteMany();
  await prisma.procurementRequest.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.orderShipping.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.altPaymentRequest.deleteMany();
  await prisma.quoteRequest.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.shippingRule.deleteMany();
  await prisma.carrierPolicy.deleteMany();
  await prisma.shippingZoneCountry.deleteMany();
  await prisma.shippingZone.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.shippingRate.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  const catalog = loadCatalogFromDisk();
  validateCatalog(catalog);

  await clearDevData();

  // Shipping bands (MVP defaults)
  await prisma.shippingRate.upsert({
    where: { band: "BAND_A" },
    create: { band: "BAND_A", amountUsd: usd(18) },
    update: { amountUsd: usd(18) },
  });
  await prisma.shippingRate.upsert({
    where: { band: "BAND_B" },
    create: { band: "BAND_B", amountUsd: usd(28) },
    update: { amountUsd: usd(28) },
  });

  // Shipping v1 zones/rules/policies (rule-table based; no real-time APIs)
  async function upsertZone(name: string, countryCodes: string[]) {
    const zone = await prisma.shippingZone.upsert({
      where: { name },
      create: { name, isActive: true },
      update: { isActive: true },
    });
    await prisma.shippingZoneCountry.deleteMany({ where: { zoneId: zone.id } });
    if (countryCodes.length > 0) {
      await prisma.shippingZoneCountry.createMany({
        data: countryCodes.map((code) => ({ zoneId: zone.id, code: code.trim().toUpperCase() })),
        skipDuplicates: true,
      });
    }
    return zone;
  }

  const zoneAsean = await upsertZone("ASEAN", ["VN", "TH", "ID", "PH", "MY", "SG"]);
  const zoneNa = await upsertZone("North America", ["US", "CA"]);
  const zoneOceania = await upsertZone("Oceania", ["AU", "NZ"]);
  const zoneEuUk = await upsertZone("EU/UK", ["GB", "DE", "FR", "IT", "ES", "NL"]);
  const zoneOther = await upsertZone("Other", []);

  type Band = "BAND_A_10PCS" | "BAND_B_20PCS" | "BAND_C_BULK";
  type Carrier = "JP_POST" | "DHL";
  const bands: Band[] = ["BAND_A_10PCS", "BAND_B_20PCS", "BAND_C_BULK"];

  const baseByZone: Record<string, { A: number; B: number }> = {
    [zoneAsean.id]: { A: 18, B: 28 },
    [zoneNa.id]: { A: 22, B: 34 },
    [zoneEuUk.id]: { A: 24, B: 36 },
    [zoneOceania.id]: { A: 25, B: 38 },
    [zoneOther.id]: { A: 28, B: 44 },
  };

  function usdForBand(zoneId: string, band: Band, carrier: Carrier) {
    const base = baseByZone[zoneId] ?? { A: 30, B: 48 };
    const jp = band === "BAND_A_10PCS" ? base.A : band === "BAND_B_20PCS" ? base.B : Math.round(base.B * 1.6);
    if (carrier === "JP_POST") return jp;
    // DHL: faster, more expensive (conservative to avoid losses)
    return jp + (band === "BAND_C_BULK" ? 25 : 15);
  }

  function etaFor(zoneId: string, carrier: Carrier): { min: number; max: number } {
    const isOceania = zoneId === zoneOceania.id;
    if (carrier === "DHL") return isOceania ? { min: 5, max: 9 } : { min: 4, max: 7 };
    return isOceania ? { min: 7, max: 12 } : { min: 8, max: 14 };
  }

  const zones = [zoneAsean, zoneNa, zoneOceania, zoneEuUk, zoneOther];
  for (const z of zones) {
    for (const band of bands) {
      for (const carrier of ["JP_POST", "DHL"] as Carrier[]) {
        const eta = etaFor(z.id, carrier);
        await prisma.shippingRule.upsert({
          where: { zoneId_band_carrier: { zoneId: z.id, band, carrier } },
          create: {
            zoneId: z.id,
            band,
            carrier,
            priceUsdCents: usd(usdForBand(z.id, band, carrier)),
            etaMinDays: eta.min,
            etaMaxDays: eta.max,
            trackingIncluded: true,
            notes:
              z.id === zoneEuUk.id
                ? "EU/UK: VAT may be collected by customs or the carrier on delivery."
                : null,
          },
          update: {
            priceUsdCents: usd(usdForBand(z.id, band, carrier)),
            etaMinDays: eta.min,
            etaMaxDays: eta.max,
            trackingIncluded: true,
            notes:
              z.id === zoneEuUk.id
                ? "EU/UK: VAT may be collected by customs or the carrier on delivery."
                : null,
          },
        });
      }
    }

    await prisma.carrierPolicy.upsert({
      where: { zoneId: z.id },
      create: {
        zoneId: z.id,
        policy: "DEFAULT",
        defaultCarrier: "JP_POST",
        forceDhlOverWeightKg: 2.5,
        forceDhlOverSubtotalUsdCents: z.id === zoneOceania.id ? usd(200) : null,
      },
      update: {
        policy: "DEFAULT",
        defaultCarrier: "JP_POST",
        forceDhlOverWeightKg: 2.5,
        forceDhlOverSubtotalUsdCents: z.id === zoneOceania.id ? usd(200) : null,
      },
    });
  }

  // Admin user (Credentials login)
  const seedEmail =
    process.env.ADMIN_SEED_EMAIL?.trim() ||
    process.env.ADMIN_EMAIL?.trim() ||
    "admin@jisway.local";
  const seedPassword =
    process.env.ADMIN_SEED_PASSWORD?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    "";

  const existingAdmin = await prisma.user.findUnique({ where: { email: seedEmail } });
  if (!existingAdmin) {
    const passwordToUse = seedPassword || "admin12345";
    const passwordHash = await bcrypt.hash(passwordToUse, 12);
    await prisma.user.create({ data: { email: seedEmail, passwordHash } });
  } else if (process.env.NODE_ENV !== "production" && seedPassword) {
    // Dev convenience: allow resetting password from env.
    const passwordHash = await bcrypt.hash(seedPassword, 12);
    await prisma.user.update({ where: { email: seedEmail }, data: { passwordHash } });
  }

  // Upsert products + variants from catalog (SSOT)
  for (const v of catalog) {
    const category = v.category as ProductCategory;
    const productSpecKey = buildSpecKey({
      category,
      standard: v.standard,
      size: v.size,
      length: v.length_mm,
      strengthClass: category === "bolt" ? v.strength_class : null,
      finish: v.finish,
    });

    const product = await prisma.product.upsert({
      where: { specKey: productSpecKey },
      create: {
        specKey: productSpecKey,
        category,
        standard: v.standard,
        size: v.size,
        length: v.length_mm,
        strengthClass: category === "bolt" ? v.strength_class : null,
        finish: v.finish,
        imageUrl: v.image_url,
      },
      update: {
        category,
        standard: v.standard,
        size: v.size,
        length: v.length_mm,
        strengthClass: category === "bolt" ? v.strength_class : null,
        finish: v.finish,
        imageUrl: v.image_url,
      },
    });

    const packType = packTypeForQty(v.pack_qty);
    const shippingBand = shippingBandForPackQty(v.pack_qty);
    const priceUsd = usd(v.price_usd);

    await prisma.variant.upsert({
      where: { slug: v.id },
      create: {
        productId: product.id,
        packType,
        shippingBand,
        slug: v.id,
        priceUsd,
        active: true,
      },
      update: {
        productId: product.id,
        packType,
        shippingBand,
        priceUsd,
        active: true,
      },
    });
  }

  const count = await prisma.variant.count();
  if (count < 1) throw new Error("Expected at least 1 variant");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

