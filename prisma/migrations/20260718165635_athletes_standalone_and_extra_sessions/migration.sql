/*
  Warnings:

  - You are about to drop the column `childId` on the `GymWorkout` table. All the data in the column will be lost.
  - You are about to drop the column `childId` on the `PoolWorkout` table. All the data in the column will be lost.
  - Added the required column `athleteId` to the `GymWorkout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `athleteId` to the `PoolWorkout` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "AttendanceStatus" ADD VALUE 'EXTRA';

-- DropForeignKey
ALTER TABLE "GymWorkout" DROP CONSTRAINT "GymWorkout_childId_fkey";

-- DropForeignKey
ALTER TABLE "PoolWorkout" DROP CONSTRAINT "PoolWorkout_childId_fkey";

-- DropIndex
DROP INDEX "GymWorkout_childId_idx";

-- DropIndex
DROP INDEX "PoolWorkout_childId_idx";

-- AlterTable
ALTER TABLE "GymWorkout" DROP COLUMN "childId",
ADD COLUMN     "athleteId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PoolWorkout" DROP COLUMN "childId",
ADD COLUMN     "athleteId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ExtraSessionEntitlement" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "sessionsPerWeek" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExtraSessionEntitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Athlete" (
    "id" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "birthDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Athlete_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExtraSessionEntitlement_groupId_idx" ON "ExtraSessionEntitlement"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "ExtraSessionEntitlement_childId_groupId_key" ON "ExtraSessionEntitlement"("childId", "groupId");

-- CreateIndex
CREATE INDEX "Athlete_lastName_firstName_idx" ON "Athlete"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "GymWorkout_athleteId_idx" ON "GymWorkout"("athleteId");

-- CreateIndex
CREATE INDEX "PoolWorkout_athleteId_idx" ON "PoolWorkout"("athleteId");

-- AddForeignKey
ALTER TABLE "ExtraSessionEntitlement" ADD CONSTRAINT "ExtraSessionEntitlement_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtraSessionEntitlement" ADD CONSTRAINT "ExtraSessionEntitlement_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolWorkout" ADD CONSTRAINT "PoolWorkout_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymWorkout" ADD CONSTRAINT "GymWorkout_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;
