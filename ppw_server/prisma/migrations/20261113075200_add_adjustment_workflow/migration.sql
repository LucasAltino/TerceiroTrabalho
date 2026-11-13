-- Incremental migration for adjustment workflow
-- Adds ADJUSTMENT_REQUESTED and CANCELLED to the ReturnStatus enum
ALTER TYPE "ReturnStatus" ADD VALUE IF NOT EXISTS 'ADJUSTMENT_REQUESTED';
ALTER TYPE "ReturnStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

-- Adds new columns to return_requests
ALTER TABLE "return_requests"
  ADD COLUMN IF NOT EXISTS "adjustment_requested_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "adjustment_reason" TEXT,
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 0;
