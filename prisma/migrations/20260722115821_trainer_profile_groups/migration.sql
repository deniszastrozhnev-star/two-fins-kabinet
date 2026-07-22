-- AlterTable
ALTER TABLE "Trainer" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "rank" "AthleteRank";

-- CreateTable
CREATE TABLE "_TrainerGroups" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TrainerGroups_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_TrainerGroups_B_index" ON "_TrainerGroups"("B");

-- AddForeignKey
ALTER TABLE "_TrainerGroups" ADD CONSTRAINT "_TrainerGroups_A_fkey" FOREIGN KEY ("A") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TrainerGroups" ADD CONSTRAINT "_TrainerGroups_B_fkey" FOREIGN KEY ("B") REFERENCES "Trainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
