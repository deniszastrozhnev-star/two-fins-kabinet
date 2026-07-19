-- CreateEnum
CREATE TYPE "AthleteRank" AS ENUM ('YOUTH_3', 'YOUTH_2', 'YOUTH_1', 'ADULT_3', 'ADULT_2', 'ADULT_1', 'KMS', 'MS', 'MSMK');

-- AlterTable
ALTER TABLE "Athlete" ADD COLUMN     "rank" "AthleteRank";

-- CreateTable
CREATE TABLE "AthleteCompetitionResult" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "competitionName" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "distance" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "resultCentis" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AthleteCompetitionResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AthleteCompetitionResult_athleteId_idx" ON "AthleteCompetitionResult"("athleteId");

-- AddForeignKey
ALTER TABLE "AthleteCompetitionResult" ADD CONSTRAINT "AthleteCompetitionResult_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;
