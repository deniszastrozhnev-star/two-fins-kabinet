-- AlterTable
ALTER TABLE "Child" ADD COLUMN     "assignedTrainerId" TEXT;

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "splitByAssignedTrainer" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_assignedTrainerId_fkey" FOREIGN KEY ("assignedTrainerId") REFERENCES "Trainer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
