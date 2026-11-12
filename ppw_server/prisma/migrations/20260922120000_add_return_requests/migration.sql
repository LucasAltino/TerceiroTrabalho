CREATE TYPE "ReturnType" AS ENUM ('DEVOLUTION', 'EXCHANGE');
CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED', 'POSTED', 'RECEIVED', 'INSPECTING', 'APPROVED', 'REJECTED', 'COMPLETED');

CREATE TABLE "return_requests" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "type" "ReturnType" NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "tracking_code" TEXT,
    "inspection_result" TEXT,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "return_requests_pkey" PRIMARY KEY ("id")
);
