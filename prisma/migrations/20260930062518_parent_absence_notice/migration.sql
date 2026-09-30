-- CreateTable
CREATE TABLE "ParentAbsenceNotice" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParentAbsenceNotice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ParentAbsenceNotice_groupId_date_idx" ON "ParentAbsenceNotice"("groupId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ParentAbsenceNotice_childId_groupId_date_key" ON "ParentAbsenceNotice"("childId", "groupId", "date");

-- AddForeignKey
ALTER TABLE "ParentAbsenceNotice" ADD CONSTRAINT "ParentAbsenceNotice_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentAbsenceNotice" ADD CONSTRAINT "ParentAbsenceNotice_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
