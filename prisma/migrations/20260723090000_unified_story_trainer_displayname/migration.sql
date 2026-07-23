-- AlterTable
ALTER TABLE "Trainer" ADD COLUMN     "displayName" TEXT;

-- CreateEnum
CREATE TYPE "StoryAuthorRole" AS ENUM ('TRAINER', 'ATHLETE', 'PARENT');

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "authorRole" "StoryAuthorRole" NOT NULL,
    "authorId" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "mediaType" "StoryMediaType" NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Story_authorRole_authorId_idx" ON "Story"("authorRole", "authorId");

-- CreateIndex
CREATE INDEX "Story_createdAt_idx" ON "Story"("createdAt");

-- Перенос данных из старой athlete-only таблицы в единую Story.
INSERT INTO "Story" ("id", "authorRole", "authorId", "mediaUrl", "mediaType", "caption", "createdAt")
SELECT "id", 'ATHLETE', "athleteId", "mediaUrl", "mediaType", "caption", "createdAt" FROM "AthleteStory";

-- DropForeignKey
ALTER TABLE "AthleteStory" DROP CONSTRAINT "AthleteStory_athleteId_fkey";

-- DropTable
DROP TABLE "AthleteStory";
