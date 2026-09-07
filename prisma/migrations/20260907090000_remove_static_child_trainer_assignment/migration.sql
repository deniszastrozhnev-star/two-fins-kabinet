-- DropForeignKey
ALTER TABLE "Child" DROP CONSTRAINT "Child_assignedTrainerId_fkey";

-- AlterTable
ALTER TABLE "Child" DROP COLUMN "assignedTrainerId";
