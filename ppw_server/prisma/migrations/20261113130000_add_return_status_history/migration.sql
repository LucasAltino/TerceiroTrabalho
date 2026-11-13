CREATE TABLE "return_status_history" (
    "id_registro" TEXT NOT NULL,
    "return_request_id" TEXT NOT NULL,
    "estado_anterior" "ReturnStatus" NOT NULL,
    "novo_estado" "ReturnStatus" NOT NULL,
    "autor_id" TEXT NOT NULL,
    "justificativa" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "return_status_history_pkey" PRIMARY KEY ("id_registro")
);

CREATE INDEX "return_status_history_return_request_id_timestamp_idx"
ON "return_status_history"("return_request_id", "timestamp");

ALTER TABLE "return_status_history"
ADD CONSTRAINT "return_status_history_return_request_id_fkey"
FOREIGN KEY ("return_request_id") REFERENCES "return_requests"("id")
ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

ALTER TABLE "return_status_history"
ADD CONSTRAINT "return_status_history_autor_id_fkey"
FOREIGN KEY ("autor_id") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
