-- CreateTable
CREATE TABLE "CustomerOffer" (
    "id" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'NEW',
    "email" TEXT NOT NULL,
    "name" TEXT,
    "company" TEXT,
    "country" TEXT,
    "variantId" TEXT,
    "offeredPriceUsdCents" INTEGER,
    "quantity" INTEGER,
    "message" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerOffer_status_createdAt_idx" ON "CustomerOffer"("status", "createdAt");
CREATE INDEX "CustomerOffer_email_createdAt_idx" ON "CustomerOffer"("email", "createdAt");
CREATE INDEX "CustomerOffer_variantId_createdAt_idx" ON "CustomerOffer"("variantId", "createdAt");

-- AddForeignKey
ALTER TABLE "CustomerOffer" ADD CONSTRAINT "CustomerOffer_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
