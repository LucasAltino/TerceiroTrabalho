CREATE TABLE "reverse_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "return_request_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    CONSTRAINT "reverse_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "reverse_codes_code_key" ON "reverse_codes"("code");
CREATE UNIQUE INDEX "reverse_codes_return_request_id_key" ON "reverse_codes"("return_request_id");
CREATE INDEX "reverse_codes_order_id_idx" ON "reverse_codes"("order_id");

ALTER TABLE "reverse_codes"
ADD CONSTRAINT "reverse_codes_return_request_id_fkey"
FOREIGN KEY ("return_request_id") REFERENCES "return_requests"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "reverse_codes"
ADD CONSTRAINT "reverse_codes_order_id_fkey"
FOREIGN KEY ("order_id") REFERENCES "orders"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
