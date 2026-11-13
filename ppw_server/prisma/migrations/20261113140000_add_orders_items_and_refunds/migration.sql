CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'PAID', 'REVERSED');

CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "items_total" DECIMAL(12,2) NOT NULL,
    "coupon_discount" DECIMAL(12,2) NOT NULL,
    "shipping_paid" DECIMAL(12,2) NOT NULL,
    "amount_paid" DECIMAL(12,2) NOT NULL,
    "amount_refunded" DECIMAL(12,2) NOT NULL DEFAULT 0,
    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "return_items" (
    "return_request_id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    CONSTRAINT "return_items_pkey" PRIMARY KEY ("return_request_id", "order_item_id")
);

CREATE TABLE "refunds" (
    "id" TEXT NOT NULL,
    "return_request_id" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "refunds_return_request_id_key" ON "refunds"("return_request_id");
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");
CREATE INDEX "return_items_order_item_id_idx" ON "return_items"("order_item_id");

ALTER TABLE "order_items"
ADD CONSTRAINT "order_items_order_id_fkey"
FOREIGN KEY ("order_id") REFERENCES "orders"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "return_requests"
ADD CONSTRAINT "return_requests_order_id_fkey"
FOREIGN KEY ("order_id") REFERENCES "orders"("id")
ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

ALTER TABLE "return_items"
ADD CONSTRAINT "return_items_return_request_id_fkey"
FOREIGN KEY ("return_request_id") REFERENCES "return_requests"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "return_items"
ADD CONSTRAINT "return_items_order_item_id_fkey"
FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "refunds"
ADD CONSTRAINT "refunds_return_request_id_fkey"
FOREIGN KEY ("return_request_id") REFERENCES "return_requests"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
