-- AlterTable
ALTER TABLE "Athlete" ADD COLUMN     "levelId" TEXT;

-- CreateTable
CREATE TABLE "AthleteLevel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ofpTask" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AthleteLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlexibilityWorkout" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "task" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlexibilityWorkout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FlexibilityWorkout_athleteId_idx" ON "FlexibilityWorkout"("athleteId");

-- AddForeignKey
ALTER TABLE "Athlete" ADD CONSTRAINT "Athlete_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "AthleteLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlexibilityWorkout" ADD CONSTRAINT "FlexibilityWorkout_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;
