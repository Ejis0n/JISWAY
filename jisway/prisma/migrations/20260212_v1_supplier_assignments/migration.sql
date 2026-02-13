-- Supplier assignments (category / size)

CREATE TABLE IF NOT EXISTS "SupplierAssignment" (
  "id" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "category" "ProductCategory" NOT NULL,
  "size" TEXT NOT NULL DEFAULT '',
  "priority" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupplierAssignment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SupplierAssignment_category_size_priority_idx"
  ON "SupplierAssignment" ("category", "size", "priority");

CREATE UNIQUE INDEX IF NOT EXISTS "SupplierAssignment_supplierId_category_size_key"
  ON "SupplierAssignment" ("supplierId", "category", "size");

ALTER TABLE "SupplierAssignment"
  ADD CONSTRAINT "SupplierAssignment_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

