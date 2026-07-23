-- CreateTable
CREATE TABLE "StoryLike" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "likerRole" "StoryAuthorRole" NOT NULL,
    "likerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoryLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoryLike_storyId_idx" ON "StoryLike"("storyId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryLike_storyId_likerRole_likerId_key" ON "StoryLike"("storyId", "likerRole", "likerId");

-- AddForeignKey
ALTER TABLE "StoryLike" ADD CONSTRAINT "StoryLike_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
