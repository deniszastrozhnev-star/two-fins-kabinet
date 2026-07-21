-- CreateEnum
CREATE TYPE "StoryMediaType" AS ENUM ('PHOTO', 'VIDEO');

-- AlterTable
ALTER TABLE "Athlete" ADD COLUMN     "avatarUrl" TEXT;

-- CreateTable
CREATE TABLE "AthleteStory" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "mediaType" "StoryMediaType" NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AthleteStory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AthleteStory_athleteId_idx" ON "AthleteStory"("athleteId");

-- CreateIndex
CREATE INDEX "AthleteStory_createdAt_idx" ON "AthleteStory"("createdAt");

-- AddForeignKey
ALTER TABLE "AthleteStory" ADD CONSTRAINT "AthleteStory_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;
