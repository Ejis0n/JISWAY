-- v1 shipping engine: zones, rules, carrier policies, order shipping snapshot

-- 1) Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ShippingRuleBand') THEN
    CREATE TYPE "ShippingRuleBand" AS ENUM ('BAND_A_10PCS','BAND_B_20PCS','BAND_C_BULK');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ShippingCarrier') THEN
    CREATE TYPE "ShippingCarrier" AS ENUM ('JP_POST','DHL');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CarrierPolicyType') THEN
    CREATE TYPE "CarrierPolicyType" AS ENUM ('CHEAPEST','FASTEST','DEFAULT');
  END IF;
END $$;

-- 2) ShippingZone
CREATE TABLE IF NOT EXISTS "ShippingZone" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShippingZone_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ShippingZone_name_key" ON "ShippingZone" ("name");

-- 3) ShippingZoneCountry
CREATE TABLE IF NOT EXISTS "ShippingZoneCountry" (
  "id" TEXT NOT NULL,
  "zoneId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "ShippingZoneCountry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ShippingZoneCountry_code_idx" ON "ShippingZoneCountry" ("code");
CREATE UNIQUE INDEX IF NOT EXISTS "ShippingZoneCountry_zoneId_code_key" ON "ShippingZoneCountry" ("zoneId","code");

ALTER TABLE "ShippingZoneCountry"
  ADD CONSTRAINT "ShippingZoneCountry_zoneId_fkey"
  FOREIGN KEY ("zoneId") REFERENCES "ShippingZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4) ShippingRule
CREATE TABLE IF NOT EXISTS "ShippingRule" (
  "id" TEXT NOT NULL,
  "zoneId" TEXT NOT NULL,
  "band" "ShippingRuleBand" NOT NULL,
  "carrier" "ShippingCarrier" NOT NULL,
  "priceUsdCents" INTEGER NOT NULL,
  "etaMinDays" INTEGER NOT NULL,
  "etaMaxDays" INTEGER NOT NULL,
  "trackingIncluded" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShippingRule_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ShippingRule_zoneId_band_carrier_idx" ON "ShippingRule" ("zoneId","band","carrier");
CREATE UNIQUE INDEX IF NOT EXISTS "ShippingRule_zoneId_band_carrier_key" ON "ShippingRule" ("zoneId","band","carrier");
CREATE INDEX IF NOT EXISTS "ShippingRule_updatedAt_idx" ON "ShippingRule" ("updatedAt");

ALTER TABLE "ShippingRule"
  ADD CONSTRAINT "ShippingRule_zoneId_fkey"
  FOREIGN KEY ("zoneId") REFERENCES "ShippingZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5) CarrierPolicy (1 per zone)
CREATE TABLE IF NOT EXISTS "CarrierPolicy" (
  "id" TEXT NOT NULL,
  "zoneId" TEXT NOT NULL,
  "policy" "CarrierPolicyType" NOT NULL DEFAULT 'DEFAULT',
  "defaultCarrier" "ShippingCarrier" NOT NULL DEFAULT 'JP_POST',
  "forceDhlOverWeightKg" DOUBLE PRECISION,
  "forceDhlOverSubtotalUsdCents" INTEGER,
  "notes" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CarrierPolicy_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CarrierPolicy_zoneId_key" ON "CarrierPolicy" ("zoneId");

ALTER TABLE "CarrierPolicy"
  ADD CONSTRAINT "CarrierPolicy_zoneId_fkey"
  FOREIGN KEY ("zoneId") REFERENCES "ShippingZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6) OrderShipping
CREATE TABLE IF NOT EXISTS "OrderShipping" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "zoneId" TEXT NOT NULL,
  "carrier" "ShippingCarrier" NOT NULL,
  "band" "ShippingRuleBand" NOT NULL,
  "shippingPriceUsd" INTEGER NOT NULL,
  "etaMinDays" INTEGER NOT NULL,
  "etaMaxDays" INTEGER NOT NULL,
  "trackingNumber" TEXT,
  "shippedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrderShipping_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "OrderShipping_orderId_key" ON "OrderShipping" ("orderId");
CREATE INDEX IF NOT EXISTS "OrderShipping_zoneId_idx" ON "OrderShipping" ("zoneId");
CREATE INDEX IF NOT EXISTS "OrderShipping_carrier_idx" ON "OrderShipping" ("carrier");

ALTER TABLE "OrderShipping"
  ADD CONSTRAINT "OrderShipping_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderShipping"
  ADD CONSTRAINT "OrderShipping_zoneId_fkey"
  FOREIGN KEY ("zoneId") REFERENCES "ShippingZone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

