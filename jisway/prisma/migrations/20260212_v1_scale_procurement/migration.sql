-- v1 scale pack: pack sizes + procurement workflow

-- 1) Extend PackType enum (safe additive)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'PackType' AND e.enumlabel = 'PACK_50'
  ) THEN
    ALTER TYPE "PackType" ADD VALUE 'PACK_50';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'PackType' AND e.enumlabel = 'PACK_100'
  ) THEN
    ALTER TYPE "PackType" ADD VALUE 'PACK_100';
  END IF;
END $$;

-- 2) New enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FulfillmentStatus') THEN
    CREATE TYPE "FulfillmentStatus" AS ENUM (
      'pending_procurement',
      'in_procurement',
      'ready_to_ship',
      'shipped',
      'completed',
      'canceled'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProcurementTaskStatus') THEN
    CREATE TYPE "ProcurementTaskStatus" AS ENUM (
      'new',
      'requested',
      'confirmed',
      'received',
      'shipped',
      'closed',
      'canceled'
    );
  END IF;
END $$;

-- 3) Order fulfillment fields
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "fulfillmentStatus" "FulfillmentStatus" NOT NULL DEFAULT 'pending_procurement',
  ADD COLUMN IF NOT EXISTS "country" TEXT,
  ADD COLUMN IF NOT EXISTS "carrier" TEXT,
  ADD COLUMN IF NOT EXISTS "trackingNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "shippedAt" TIMESTAMP(3);

-- 4) Supplier
CREATE TABLE IF NOT EXISTS "Supplier" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "leadTimeDays" INTEGER,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Supplier_name_idx" ON "Supplier" ("name");

-- 5) ProcurementTask + lines
CREATE TABLE IF NOT EXISTS "ProcurementTask" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "status" "ProcurementTaskStatus" NOT NULL DEFAULT 'new',
  "supplierId" TEXT,
  "requestedAt" TIMESTAMP(3),
  "confirmedAt" TIMESTAMP(3),
  "receivedAt" TIMESTAMP(3),
  "shippedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "procurementNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProcurementTask_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProcurementTask_orderId_key" ON "ProcurementTask" ("orderId");
CREATE INDEX IF NOT EXISTS "ProcurementTask_status_createdAt_idx" ON "ProcurementTask" ("status", "createdAt");
CREATE INDEX IF NOT EXISTS "ProcurementTask_supplierId_createdAt_idx" ON "ProcurementTask" ("supplierId", "createdAt");

ALTER TABLE "ProcurementTask"
  ADD CONSTRAINT "ProcurementTask_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProcurementTask"
  ADD CONSTRAINT "ProcurementTask_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "ProcurementTaskLine" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "qtyPacks" INTEGER NOT NULL,
  "packQty" INTEGER NOT NULL,
  "unitCostJpy" INTEGER,
  "expectedCostJpy" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProcurementTaskLine_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProcurementTaskLine_taskId_idx" ON "ProcurementTaskLine" ("taskId");
CREATE INDEX IF NOT EXISTS "ProcurementTaskLine_variantId_idx" ON "ProcurementTaskLine" ("variantId");

ALTER TABLE "ProcurementTaskLine"
  ADD CONSTRAINT "ProcurementTaskLine_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "ProcurementTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProcurementTaskLine"
  ADD CONSTRAINT "ProcurementTaskLine_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 6) Shipment table
CREATE TABLE IF NOT EXISTS "Shipment" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "carrier" TEXT,
  "trackingNumber" TEXT,
  "shippedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Shipment_orderId_createdAt_idx" ON "Shipment" ("orderId", "createdAt");

ALTER TABLE "Shipment"
  ADD CONSTRAINT "Shipment_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

