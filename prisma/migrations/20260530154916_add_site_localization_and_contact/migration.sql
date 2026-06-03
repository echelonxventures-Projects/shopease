-- Adds region/locale/currency/contact fields to the Site model so the
-- Create/Edit Site form can persist multi-tenant configuration.
-- Idempotent: every column is nullable or has a default; FK uses ON DELETE
-- SET NULL so deleting a Region does not cascade-delete sites.

ALTER TABLE "sites"
  ADD COLUMN IF NOT EXISTS "contactAddress"   TEXT,
  ADD COLUMN IF NOT EXISTS "contactEmail"     TEXT,
  ADD COLUMN IF NOT EXISTS "contactPhone"     TEXT,
  ADD COLUMN IF NOT EXISTS "defaultCurrency"  TEXT,
  ADD COLUMN IF NOT EXISTS "defaultLocale"    TEXT,
  ADD COLUMN IF NOT EXISTS "regionId"         TEXT,
  ADD COLUMN IF NOT EXISTS "supportedLocales" TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS "sites_regionId_idx" ON "sites"("regionId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sites_regionId_fkey'
  ) THEN
    ALTER TABLE "sites"
      ADD CONSTRAINT "sites_regionId_fkey"
      FOREIGN KEY ("regionId") REFERENCES "Region"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
