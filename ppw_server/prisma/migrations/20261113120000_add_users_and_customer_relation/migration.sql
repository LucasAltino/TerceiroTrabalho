CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'INSPECTOR', 'FINANCE', 'ADMIN');

CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

ALTER TABLE "return_requests"
ADD CONSTRAINT "return_requests_customer_id_fkey"
FOREIGN KEY ("customer_id") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
