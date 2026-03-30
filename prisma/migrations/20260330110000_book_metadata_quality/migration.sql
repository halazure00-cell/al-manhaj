-- Add explicit metadata fields to improve book data quality for AI analysis
ALTER TABLE "Book"
  ADD COLUMN "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "source" TEXT,
  ADD COLUMN "initialNote" TEXT;

-- Backfill addedAt from historical createdAt to preserve timeline semantics
UPDATE "Book"
SET "addedAt" = "createdAt"
WHERE "addedAt" IS NULL;
