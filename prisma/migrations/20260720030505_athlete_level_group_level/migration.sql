/*
  Warnings:

  - You are about to drop the column `levelId` on the `Athlete` table. All the data in the column will be lost.
  - You are about to drop the `AthleteLevel` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Athlete" DROP CONSTRAINT "Athlete_levelId_fkey";

-- AlterTable
ALTER TABLE "Athlete" DROP COLUMN "levelId",
ADD COLUMN     "level" "GroupLevel";

-- DropTable
DROP TABLE "AthleteLevel";

-- CreateTable
CREATE TABLE "LevelTraining" (
    "id" TEXT NOT NULL,
    "level" "GroupLevel" NOT NULL,
    "ofpTask" TEXT NOT NULL,
    "flexibilityTask" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LevelTraining_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LevelTraining_level_key" ON "LevelTraining"("level");
