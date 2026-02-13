-- Growth launch pack: analytics + procurement tables
-- Note: This migration only ADDS new types/tables. It does not modify existing business tables.

-- Enums (create-if-missing)
DO $$ BEGIN
  CREATE TYPE "AnalyticsEventName" AS ENUM ('PageView','AddToCart','StartCheckout','SubmitQuote','SubmitProcure');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ProcurementStatus" AS ENUM ('NEW','IN_PROGRESS','COMPLETED','REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Tables
CREATE TABLE IF NOT EXISTS "AnalyticsEvent" (
  "id" TEXT NOT NULL,
  "name" "AnalyticsEventName" NOT NULL,
  "path" TEXT NOT NULL,
  "country" TEXT,
  "variantId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AnalyticsEvent_name_createdAt_idx" ON "AnalyticsEvent"("name","createdAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_path_createdAt_idx" ON "AnalyticsEvent"("path","createdAt");

CREATE TABLE IF NOT EXISTS "ProcurementRequest" (
  "id" TEXT NOT NULL,
  "status" "ProcurementStatus" NOT NULL DEFAULT 'NEW',
  "name" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "specText" TEXT NOT NULL,
  "quantity" INTEGER,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProcurementRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProcurementRequest_status_createdAt_idx" ON "ProcurementRequest"("status","createdAt");
CREATE INDEX IF NOT EXISTS "ProcurementRequest_email_createdAt_idx" ON "ProcurementRequest"("email","createdAt");

