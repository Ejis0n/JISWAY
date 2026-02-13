-- v1 stripe chargeback defense: acknowledgements + evidence + dispute status

-- 1) Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DisputeStatus') THEN
    CREATE TYPE "DisputeStatus" AS ENUM ('none','in_dispute','won','lost');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrderEvidenceType') THEN
    CREATE TYPE "OrderEvidenceType" AS ENUM (
      'acknowledgement',
      'invoice',
      'receipt',
      'shipping_label',
      'tracking',
      'delivery_confirmation',
      'packaging_photo',
      'item_photo',
      'communication'
    );
  END IF;
END $$;

-- 2) Order.disputeStatus
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "disputeStatus" "DisputeStatus" NOT NULL DEFAULT 'none';

-- 3) OrderAcknowledgement
CREATE TABLE IF NOT EXISTS "OrderAcknowledgement" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "checkoutSessionId" TEXT,
  "ackExactSpec" BOOLEAN NOT NULL,
  "ackNoInventory" BOOLEAN NOT NULL,
  "ackDutiesTaxes" BOOLEAN NOT NULL,
  "ackRefundPolicy" BOOLEAN NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderAcknowledgement_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "OrderAcknowledgement_orderId_acknowledgedAt_idx" ON "OrderAcknowledgement" ("orderId","acknowledgedAt");
CREATE INDEX IF NOT EXISTS "OrderAcknowledgement_checkoutSessionId_idx" ON "OrderAcknowledgement" ("checkoutSessionId");

ALTER TABLE "OrderAcknowledgement"
  ADD CONSTRAINT "OrderAcknowledgement_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4) OrderEvidence
CREATE TABLE IF NOT EXISTS "OrderEvidence" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "type" "OrderEvidenceType" NOT NULL,
  "fileUrl" TEXT,
  "textContent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderEvidence_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "OrderEvidence_orderId_createdAt_idx" ON "OrderEvidence" ("orderId","createdAt");
CREATE INDEX IF NOT EXISTS "OrderEvidence_type_createdAt_idx" ON "OrderEvidence" ("type","createdAt");

ALTER TABLE "OrderEvidence"
  ADD CONSTRAINT "OrderEvidence_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

