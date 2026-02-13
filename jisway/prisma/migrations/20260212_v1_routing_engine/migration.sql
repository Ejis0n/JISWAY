-- v1 routing engine: offers + decisions + config + split procurement tasks

-- 1) Extend ProcurementTaskStatus enum (additive)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'ProcurementTaskStatus' AND e.enumlabel = 'needs_assignment'
  ) THEN
    ALTER TYPE "ProcurementTaskStatus" ADD VALUE 'needs_assignment';
  END IF;
END $$;

-- 2) Enums for routing/offers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SupplierAvailability') THEN
    CREATE TYPE "SupplierAvailability" AS ENUM ('in_stock','limited','backorder','unknown');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RoutingStrategy') THEN
    CREATE TYPE "RoutingStrategy" AS ENUM ('CHEAPEST','FASTEST','BALANCED','AVAILABILITY_FIRST');
  END IF;
END $$;

-- 3) RoutingConfig (singleton)
CREATE TABLE IF NOT EXISTS "RoutingConfig" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "enabled" BOOLEAN NOT NULL DEFAULT FALSE,
  "strategy" "RoutingStrategy" NOT NULL DEFAULT 'BALANCED',
  "weights" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RoutingConfig_pkey" PRIMARY KEY ("id")
);

-- 4) SupplierOffer
CREATE TABLE IF NOT EXISTS "SupplierOffer" (
  "id" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "variantId" TEXT,
  "category" "ProductCategory",
  "size" TEXT,
  "lengthMm" INTEGER,
  "finish" TEXT,
  "strengthClass" TEXT,
  "packQty" INTEGER,
  "unitCostJpy" INTEGER NOT NULL,
  "minOrderPacks" INTEGER NOT NULL DEFAULT 1,
  "leadTimeDays" INTEGER,
  "availability" "SupplierAvailability" NOT NULL DEFAULT 'unknown',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupplierOffer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SupplierOffer_supplierId_updatedAt_idx" ON "SupplierOffer" ("supplierId","updatedAt");
CREATE INDEX IF NOT EXISTS "SupplierOffer_variantId_idx" ON "SupplierOffer" ("variantId");
CREATE INDEX IF NOT EXISTS "SupplierOffer_category_size_packQty_idx" ON "SupplierOffer" ("category","size","packQty");

ALTER TABLE "SupplierOffer"
  ADD CONSTRAINT "SupplierOffer_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupplierOffer"
  ADD CONSTRAINT "SupplierOffer_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 5) RoutingDecision
CREATE TABLE IF NOT EXISTS "RoutingDecision" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "chosenSupplierId" TEXT,
  "strategy" "RoutingStrategy" NOT NULL,
  "scoreJson" JSONB NOT NULL,
  "reasonText" TEXT NOT NULL,
  "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RoutingDecision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RoutingDecision_orderId_decidedAt_idx" ON "RoutingDecision" ("orderId","decidedAt");
CREATE INDEX IF NOT EXISTS "RoutingDecision_variantId_decidedAt_idx" ON "RoutingDecision" ("variantId","decidedAt");
CREATE INDEX IF NOT EXISTS "RoutingDecision_chosenSupplierId_decidedAt_idx" ON "RoutingDecision" ("chosenSupplierId","decidedAt");

ALTER TABLE "RoutingDecision"
  ADD CONSTRAINT "RoutingDecision_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RoutingDecision"
  ADD CONSTRAINT "RoutingDecision_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RoutingDecision"
  ADD CONSTRAINT "RoutingDecision_chosenSupplierId_fkey"
  FOREIGN KEY ("chosenSupplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 6) ProcurementTask: allow multiple tasks per order (drop unique index)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i' AND c.relname = 'ProcurementTask_orderId_key'
  ) THEN
    DROP INDEX "ProcurementTask_orderId_key";
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "ProcurementTask_orderId_createdAt_idx" ON "ProcurementTask" ("orderId","createdAt");

