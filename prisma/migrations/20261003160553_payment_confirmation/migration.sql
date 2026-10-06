-- CreateEnum
CREATE TYPE "PaymentConfirmationSource" AS ENUM ('RECEIPT_TARIFF', 'RECEIPT_MANUAL', 'MARK_PAID', 'DATE_EDIT');

-- CreateTable
CREATE TABLE "PaymentConfirmation" (
    "id" TEXT NOT NULL,
    "childId" TEXT,
    "amountRub" INTEGER,
    "paidUntil" DATE NOT NULL,
    "source" "PaymentConfirmationSource" NOT NULL,
    "confirmedByTrainerId" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentConfirmation_paidAt_idx" ON "PaymentConfirmation"("paidAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentConfirmation_childId_paidUntil_key" ON "PaymentConfirmation"("childId", "paidUntil");

-- AddForeignKey
ALTER TABLE "PaymentConfirmation" ADD CONSTRAINT "PaymentConfirmation_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentConfirmation" ADD CONSTRAINT "PaymentConfirmation_confirmedByTrainerId_fkey" FOREIGN KEY ("confirmedByTrainerId") REFERENCES "Trainer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
