-- Incremental migration for adjustment workflow

ALTER TYPE "ReturnStatus" ADD VALUE 'ADJUSTMENT_REQUESTED';

ALTER TABLE "return_requests"
  ADD COLUMN "adjustment_requested_at" TIMESTAMP(3),
  ADD COLUMN "adjustment_reason" TEXT,
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;

