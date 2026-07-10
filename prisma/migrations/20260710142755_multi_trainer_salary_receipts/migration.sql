-- CreateEnum
CREATE TYPE "TrainerRole" AS ENUM ('HEAD', 'TRAINER');

-- CreateEnum
CREATE TYPE "PersonType" AS ENUM ('CHILD', 'ADULT');

-- AlterTable: добавляем роль, существующий единственный тренер становится HEAD
ALTER TABLE "Trainer" ADD COLUMN     "role" "TrainerRole" NOT NULL DEFAULT 'TRAINER';
UPDATE "Trainer" SET "role" = 'HEAD';

-- AlterTable: добавляем колонку нулевой (в таблице уже есть строки), бэкфиллим на единственного
-- существующего тренера, затем делаем обязательной
ALTER TABLE "AttendanceRecord" ADD COLUMN     "markedByTrainerId" TEXT;
UPDATE "AttendanceRecord" SET "markedByTrainerId" = (SELECT "id" FROM "Trainer" ORDER BY "createdAt" ASC LIMIT 1)
  WHERE "markedByTrainerId" IS NULL;
ALTER TABLE "AttendanceRecord" ALTER COLUMN "markedByTrainerId" SET NOT NULL;

-- CreateTable
CREATE TABLE "PersonalTraining" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "time" TEXT NOT NULL,
    "personType" "PersonType" NOT NULL,
    "childId" TEXT,
    "adultName" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonalTraining_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentReceipt" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewedAt" TIMESTAMP(3),

    CONSTRAINT "PaymentReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PersonalTraining_trainerId_date_idx" ON "PersonalTraining"("trainerId", "date");

-- CreateIndex
CREATE INDEX "PaymentReceipt_childId_idx" ON "PaymentReceipt"("childId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_markedByTrainerId_date_idx" ON "AttendanceRecord"("markedByTrainerId", "date");

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_markedByTrainerId_fkey" FOREIGN KEY ("markedByTrainerId") REFERENCES "Trainer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalTraining" ADD CONSTRAINT "PersonalTraining_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalTraining" ADD CONSTRAINT "PersonalTraining_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReceipt" ADD CONSTRAINT "PaymentReceipt_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
