-- PushSubscription: re-key from childId to parentPhone (family-wide push).
-- Backfill from the existing child relation before dropping the old column,
-- so real subscriptions already in the table are preserved.
ALTER TABLE "PushSubscription" ADD COLUMN "parentPhone" TEXT;

UPDATE "PushSubscription" ps
SET "parentPhone" = c."parentPhone"
FROM "Child" c
WHERE ps."childId" = c.id;

ALTER TABLE "PushSubscription" ALTER COLUMN "parentPhone" SET NOT NULL;

ALTER TABLE "PushSubscription" DROP CONSTRAINT "PushSubscription_childId_fkey";
DROP INDEX "PushSubscription_childId_idx";
ALTER TABLE "PushSubscription" DROP COLUMN "childId";

CREATE INDEX "PushSubscription_parentPhone_idx" ON "PushSubscription"("parentPhone");

-- CreateEnum
CREATE TYPE "MedicalReminderKind" AS ENUM ('BEFORE_14D', 'DUE_TODAY');

-- CreateTable
CREATE TABLE "MedicalReminderSent" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "kind" "MedicalReminderKind" NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicalReminderSent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MedicalReminderSent_childId_kind_validUntil_key" ON "MedicalReminderSent"("childId", "kind", "validUntil");

-- CreateIndex
CREATE INDEX "MedicalReminderSent_childId_idx" ON "MedicalReminderSent"("childId");

-- AddForeignKey
ALTER TABLE "MedicalReminderSent" ADD CONSTRAINT "MedicalReminderSent_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "BirthdayGreetingSent" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BirthdayGreetingSent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BirthdayGreetingSent_childId_year_key" ON "BirthdayGreetingSent"("childId", "year");

-- CreateIndex
CREATE INDEX "BirthdayGreetingSent_childId_idx" ON "BirthdayGreetingSent"("childId");

-- AddForeignKey
ALTER TABLE "BirthdayGreetingSent" ADD CONSTRAINT "BirthdayGreetingSent_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "sendBirthdayGreetings" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);
