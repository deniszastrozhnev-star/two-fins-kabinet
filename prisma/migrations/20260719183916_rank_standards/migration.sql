/*
  Warnings:

  - You are about to drop the column `distance` on the `AthleteCompetitionResult` table. All the data in the column will be lost.
  - You are about to drop the column `style` on the `AthleteCompetitionResult` table. All the data in the column will be lost.
  - Added the required column `discipline` to the `AthleteCompetitionResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timing` to the `AthleteCompetitionResult` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "FinDiscipline" AS ENUM ('APNEA50', 'M50', 'M100', 'M200', 'M400', 'M800', 'M1500', 'UNDERWATER100', 'UNDERWATER400', 'CLASSIC50', 'CLASSIC100', 'CLASSIC200', 'CLASSIC400');

-- CreateEnum
CREATE TYPE "TimingType" AS ENUM ('MANUAL', 'AUTO');

-- AlterTable
ALTER TABLE "Athlete" ADD COLUMN     "gender" "Gender";

-- AlterTable
ALTER TABLE "AthleteCompetitionResult" DROP COLUMN "distance",
DROP COLUMN "style",
ADD COLUMN     "discipline" "FinDiscipline" NOT NULL,
ADD COLUMN     "timing" "TimingType" NOT NULL;

-- CreateTable
CREATE TABLE "RankStandard" (
    "id" TEXT NOT NULL,
    "discipline" "FinDiscipline" NOT NULL,
    "timing" "TimingType" NOT NULL,
    "gender" "Gender" NOT NULL,
    "rank" "AthleteRank" NOT NULL,
    "centiseconds" INTEGER NOT NULL,

    CONSTRAINT "RankStandard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RankStandard_discipline_timing_gender_rank_key" ON "RankStandard"("discipline", "timing", "gender", "rank");
