-- Fintech & workflow fields (additive, non-destructive)
-- Wallet/User/Order/AuditLog metadata, Inventory.reserved, Refund.method/processedAt, OrderStatus.PACKED

ALTER TABLE "User" ADD COLUMN "metadata" JSONB;
ALTER TABLE "Wallet" ADD COLUMN "metadata" JSONB;
ALTER TABLE "Order" ADD COLUMN "metadata" JSONB;
ALTER TABLE "AuditLog" ADD COLUMN "metadata" JSONB;
ALTER TABLE "Inventory" ADD COLUMN "reserved" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Refund" ADD COLUMN "method" TEXT;
ALTER TABLE "Refund" ADD COLUMN "processedAt" TIMESTAMP(3);

-- Enum value (run outside a transaction; cannot be used in the same tx in older PG)
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PACKED';
