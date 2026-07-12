-- CreateEnum
CREATE TYPE "ChildStatus" AS ENUM ('ACTIVE', 'SICK');

-- AlterTable
ALTER TABLE "Child" ADD COLUMN     "note" TEXT,
ADD COLUMN     "status" "ChildStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "capacity" INTEGER,
ADD COLUMN     "pricePerMonth" INTEGER;

-- CreateTable
CREATE TABLE "GroupWaitlist" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupWaitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalCertificate" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "contentType" TEXT,
    "validUntil" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicalCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionResult" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "competitionName" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "result" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitionResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GroupWaitlist_groupId_idx" ON "GroupWaitlist"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupWaitlist_childId_groupId_key" ON "GroupWaitlist"("childId", "groupId");

-- CreateIndex
CREATE INDEX "MedicalCertificate_childId_idx" ON "MedicalCertificate"("childId");

-- CreateIndex
CREATE INDEX "CompetitionResult_childId_idx" ON "CompetitionResult"("childId");

-- AddForeignKey
ALTER TABLE "GroupWaitlist" ADD CONSTRAINT "GroupWaitlist_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupWaitlist" ADD CONSTRAINT "GroupWaitlist_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalCertificate" ADD CONSTRAINT "MedicalCertificate_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionResult" ADD CONSTRAINT "CompetitionResult_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
