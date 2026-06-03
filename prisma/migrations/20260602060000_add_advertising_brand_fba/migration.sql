-- Advertising, brand registry & FBA (additive, non-destructive)

ALTER TABLE "Brand" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "Brand" ADD COLUMN "registrationStatus" TEXT NOT NULL DEFAULT 'NONE';
ALTER TABLE "Brand" ADD COLUMN "registeredAt" TIMESTAMP(3);

CREATE TABLE "ad_campaigns" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT,
    "productId" TEXT NOT NULL,
    "bid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "budget" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "spent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ad_campaigns_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ad_campaigns_status_productId_idx" ON "ad_campaigns"("status", "productId");
CREATE INDEX "ad_campaigns_sellerId_idx" ON "ad_campaigns"("sellerId");

CREATE TABLE "fba_enrollments" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sellerId" TEXT,
    "mfcId" TEXT NOT NULL,
    "units" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ENROLLED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "fba_enrollments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "fba_enrollments_productId_idx" ON "fba_enrollments"("productId");
CREATE INDEX "fba_enrollments_mfcId_status_idx" ON "fba_enrollments"("mfcId", "status");
