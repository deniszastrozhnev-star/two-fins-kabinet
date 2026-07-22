-- DropIndex
DROP INDEX "LevelTraining_level_key";

-- AlterTable
ALTER TABLE "LevelTraining" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "date" DATE;

-- Существующая запись (если есть) на уровень трактуется как задание на сегодня —
-- натурального "дня" у прежней модели не было, это разумная точка отсчёта истории.
UPDATE "LevelTraining" SET "date" = CURRENT_DATE WHERE "date" IS NULL;

-- AlterTable
ALTER TABLE "LevelTraining" ALTER COLUMN "date" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "LevelTraining_level_date_key" ON "LevelTraining"("level", "date");
