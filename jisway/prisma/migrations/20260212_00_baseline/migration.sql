-- Baseline: core tables required by shipping_engine and later migrations (Order, User, Product, Variant, etc.)

-- Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProductCategory') THEN
    CREATE TYPE "ProductCategory" AS ENUM ('bolt','nut','washer');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PackType') THEN
    CREATE TYPE "PackType" AS ENUM ('PACK_10','PACK_20','PACK_50','PACK_100');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ShippingBand') THEN
    CREATE TYPE "ShippingBand" AS ENUM ('BAND_A','BAND_B');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrderStatus') THEN
    CREATE TYPE "OrderStatus" AS ENUM ('created','paid','failed','canceled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FulfillmentStatus') THEN
    CREATE TYPE "FulfillmentStatus" AS ENUM ('pending_procurement','in_procurement','ready_to_ship','shipped','completed','canceled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DisputeStatus') THEN
    CREATE TYPE "DisputeStatus" AS ENUM ('none','in_dispute','won','lost');
  END IF;
END $$;

-- User
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- Product
CREATE TABLE IF NOT EXISTS "Product" (
  "id" TEXT NOT NULL,
  "specKey" TEXT NOT NULL,
  "category" "ProductCategory" NOT NULL,
  "standard" TEXT NOT NULL DEFAULT 'JIS',
  "size" TEXT NOT NULL,
  "length" INTEGER,
  "strengthClass" TEXT,
  "finish" TEXT NOT NULL DEFAULT 'zinc plated',
  "imageUrl" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Product_specKey_key" ON "Product"("specKey");
CREATE INDEX IF NOT EXISTS "Product_category_size_idx" ON "Product"("category","size");

-- Variant
CREATE TABLE IF NOT EXISTS "Variant" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "packType" "PackType" NOT NULL,
  "shippingBand" "ShippingBand" NOT NULL,
  "slug" TEXT NOT NULL,
  "priceUsd" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Variant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Variant_slug_key" ON "Variant"("slug");
CREATE INDEX IF NOT EXISTS "Variant_packType_idx" ON "Variant"("packType");
CREATE INDEX IF NOT EXISTS "Variant_shippingBand_idx" ON "Variant"("shippingBand");
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ShippingRate
CREATE TABLE IF NOT EXISTS "ShippingRate" (
  "id" TEXT NOT NULL,
  "band" "ShippingBand" NOT NULL,
  "amountUsd" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShippingRate_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ShippingRate_band_key" ON "ShippingRate"("band");

-- AppEvent
CREATE TABLE IF NOT EXISTS "AppEvent" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "meta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AppEvent_type_createdAt_idx" ON "AppEvent"("type","createdAt");

-- StripeEvent
CREATE TABLE IF NOT EXISTS "StripeEvent" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "meta" JSONB,
  CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);

-- Order
CREATE TABLE IF NOT EXISTS "Order" (
  "id" TEXT NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'created',
  "fulfillmentStatus" "FulfillmentStatus" NOT NULL DEFAULT 'pending_procurement',
  "disputeStatus" "DisputeStatus" NOT NULL DEFAULT 'none',
  "email" TEXT,
  "country" TEXT,
  "subtotalUsd" INTEGER NOT NULL,
  "shippingUsd" INTEGER NOT NULL,
  "totalUsd" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'usd',
  "stripeCheckoutSessionId" TEXT NOT NULL,
  "stripePaymentIntentId" TEXT,
  "stripeCustomerId" TEXT,
  "paidAt" TIMESTAMP(3),
  "carrier" TEXT,
  "trackingNumber" TEXT,
  "shippedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Order_stripeCheckoutSessionId_key" ON "Order"("stripeCheckoutSessionId");

-- OrderItem
CREATE TABLE IF NOT EXISTS "OrderItem" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPriceUsd" INTEGER NOT NULL,
  "lineTotalUsd" INTEGER NOT NULL,
  "specSnapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
