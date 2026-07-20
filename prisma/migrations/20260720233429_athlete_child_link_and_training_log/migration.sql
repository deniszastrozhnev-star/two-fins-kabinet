-- CreateEnum
CREATE TYPE "TrainingLogType" AS ENUM ('OFP', 'FLEXIBILITY');

-- AlterTable
ALTER TABLE "Athlete" ADD COLUMN     "linkedChildId" TEXT;

-- CreateTable
CREATE TABLE "LevelTrainingLog" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "level" "GroupLevel" NOT NULL,
    "type" "TrainingLogType" NOT NULL,
    "date" DATE NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LevelTrainingLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LevelTrainingLog_athleteId_idx" ON "LevelTrainingLog"("athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "Athlete_linkedChildId_key" ON "Athlete"("linkedChildId");

-- AddForeignKey
ALTER TABLE "Athlete" ADD CONSTRAINT "Athlete_linkedChildId_fkey" FOREIGN KEY ("linkedChildId") REFERENCES "Child"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevelTrainingLog" ADD CONSTRAINT "LevelTrainingLog_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;
