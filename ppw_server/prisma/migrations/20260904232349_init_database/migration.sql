-- CreateEnum
CREATE TYPE "Prioridade" AS ENUM ('alta', 'media', 'baixa');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ABERTO', 'CONCLUIDO');

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "prioridade" "Prioridade" NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ABERTO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);
