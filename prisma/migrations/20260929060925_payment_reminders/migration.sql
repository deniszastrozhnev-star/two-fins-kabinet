-- CreateEnum
CREATE TYPE "PaymentReminderKind" AS ENUM ('BEFORE_3D', 'DUE_TODAY', 'OVERDUE_3D');

-- CreateTable
CREATE TABLE "PaymentReminderSent" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "kind" "PaymentReminderKind" NOT NULL,
    "paidUntil" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentReminderSent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentReminderSent_childId_kind_paidUntil_key" ON "PaymentReminderSent"("childId", "kind", "paidUntil");

-- CreateIndex
CREATE INDEX "PaymentReminderSent_childId_idx" ON "PaymentReminderSent"("childId");

-- AddForeignKey
ALTER TABLE "PaymentReminderSent" ADD CONSTRAINT "PaymentReminderSent_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
