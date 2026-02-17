-- v1 dynamic pricing engine: FX, cost basis, pricing rules, price change logs

-- 1) Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FxPair') THEN
    CREATE TYPE "FxPair" AS ENUM ('JPYUSD');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FxSource') THEN
    CREATE TYPE "FxSource" AS ENUM ('manual','provider');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CostSource') THEN
    CREATE TYPE "CostSource" AS ENUM ('supplier_offer','manual');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PricingRuleScope') THEN
    CREATE TYPE "PricingRuleScope" AS ENUM ('global','category','size','variant');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RoundingStrategy') THEN
    CREATE TYPE "RoundingStrategy" AS ENUM ('USD_0_00','USD_0_99','USD_0_49');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SupplierAvailability') THEN
    CREATE TYPE "SupplierAvailability" AS ENUM ('in_stock','limited','backorder','unknown');
  END IF;
END $$;

-- 2) FxRate
CREATE TABLE IF NOT EXISTS "FxRate" (
  "id" TEXT NOT NULL,
  "pair" "FxPair" NOT NULL,
  "rate" DOUBLE PRECISION NOT NULL,
  "source" "FxSource" NOT NULL DEFAULT 'manual',
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FxRate_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FxRate_pair_capturedAt_idx" ON "FxRate" ("pair","capturedAt");

-- 3) CostBasis
CREATE TABLE IF NOT EXISTS "CostBasis" (
  "id" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "supplierId" TEXT,
  "costJpyPerPack" INTEGER NOT NULL,
  "leadTimeDays" INTEGER,
  "availability" "SupplierAvailability",
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "source" "CostSource" NOT NULL,
  CONSTRAINT "CostBasis_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CostBasis_variantId_capturedAt_idx" ON "CostBasis" ("variantId","capturedAt");
CREATE INDEX IF NOT EXISTS "CostBasis_supplierId_capturedAt_idx" ON "CostBasis" ("supplierId","capturedAt");

ALTER TABLE "CostBasis"
  ADD CONSTRAINT "CostBasis_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CostBasis"
  ADD CONSTRAINT "CostBasis_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 4) PricingRule
CREATE TABLE IF NOT EXISTS "PricingRule" (
  "id" TEXT NOT NULL,
  "scope" "PricingRuleScope" NOT NULL,
  "category" "ProductCategory",
  "size" TEXT,
  "variantId" TEXT,
  "targetGrossMargin" DOUBLE PRECISION NOT NULL,
  "minPriceUsdCents" INTEGER NOT NULL,
  "maxPriceUsdCents" INTEGER NOT NULL,
  "rounding" "RoundingStrategy" NOT NULL DEFAULT 'USD_0_99',
  "maxWeeklyChangePct" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PricingRule_scope_updatedAt_idx" ON "PricingRule" ("scope","updatedAt");
CREATE INDEX IF NOT EXISTS "PricingRule_category_size_idx" ON "PricingRule" ("category","size");
CREATE INDEX IF NOT EXISTS "PricingRule_variantId_idx" ON "PricingRule" ("variantId");

ALTER TABLE "PricingRule"
  ADD CONSTRAINT "PricingRule_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5) PriceChangeLog
CREATE TABLE IF NOT EXISTS "PriceChangeLog" (
  "id" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "oldPriceUsd" INTEGER NOT NULL,
  "newPriceUsd" INTEGER NOT NULL,
  "reasonJson" JSONB NOT NULL,
  "appliedByAdminId" TEXT,
  "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PriceChangeLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PriceChangeLog_variantId_appliedAt_idx" ON "PriceChangeLog" ("variantId","appliedAt");
CREATE INDEX IF NOT EXISTS "PriceChangeLog_appliedByAdminId_appliedAt_idx" ON "PriceChangeLog" ("appliedByAdminId","appliedAt");

ALTER TABLE "PriceChangeLog"
  ADD CONSTRAINT "PriceChangeLog_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PriceChangeLog"
  ADD CONSTRAINT "PriceChangeLog_appliedByAdminId_fkey"
  FOREIGN KEY ("appliedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

