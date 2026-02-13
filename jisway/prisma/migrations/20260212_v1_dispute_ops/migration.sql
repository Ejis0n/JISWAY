-- v1 dispute-proof ops: support tickets + evidence URLs on shipping/procurement

-- 1) Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SupportTicketCategory') THEN
    CREATE TYPE "SupportTicketCategory" AS ENUM ('misorder','damage','lost','customs','billing','other');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SupportTicketStatus') THEN
    CREATE TYPE "SupportTicketStatus" AS ENUM ('new','in_progress','waiting_customer','resolved','rejected');
  END IF;
END $$;

-- 2) Evidence fields
ALTER TABLE "OrderShipping"
  ADD COLUMN IF NOT EXISTS "packagingPhotoUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "shipmentPhotoUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "ProcurementTask"
  ADD COLUMN IF NOT EXISTS "packagingPhotoUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "shipmentPhotoUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- 3) SupportTicket
CREATE TABLE IF NOT EXISTS "SupportTicket" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "company" TEXT,
  "email" TEXT NOT NULL,
  "country" TEXT,
  "orderId" TEXT,
  "category" "SupportTicketCategory" NOT NULL DEFAULT 'other',
  "message" TEXT NOT NULL,
  "status" "SupportTicketStatus" NOT NULL DEFAULT 'new',
  "internalNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SupportTicket_email_createdAt_idx" ON "SupportTicket" ("email","createdAt");
CREATE INDEX IF NOT EXISTS "SupportTicket_status_updatedAt_idx" ON "SupportTicket" ("status","updatedAt");
CREATE INDEX IF NOT EXISTS "SupportTicket_category_updatedAt_idx" ON "SupportTicket" ("category","updatedAt");
CREATE INDEX IF NOT EXISTS "SupportTicket_orderId_createdAt_idx" ON "SupportTicket" ("orderId","createdAt");

-- 4) SupportAttachment
CREATE TABLE IF NOT EXISTS "SupportAttachment" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'photo',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportAttachment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SupportAttachment_ticketId_idx" ON "SupportAttachment" ("ticketId");

ALTER TABLE "SupportAttachment"
  ADD CONSTRAINT "SupportAttachment_ticketId_fkey"
  FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

