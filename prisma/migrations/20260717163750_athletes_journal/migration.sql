-- AlterTable
ALTER TABLE "Child" ADD COLUMN     "birthDate" DATE;

-- CreateTable
CREATE TABLE "PoolWorkout" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "task" TEXT NOT NULL,
    "volumeMeters" INTEGER NOT NULL,
    "feeling" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PoolWorkout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GymWorkout" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "task" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GymWorkout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PoolWorkout_childId_idx" ON "PoolWorkout"("childId");

-- CreateIndex
CREATE INDEX "GymWorkout_childId_idx" ON "GymWorkout"("childId");

-- AddForeignKey
ALTER TABLE "PoolWorkout" ADD CONSTRAINT "PoolWorkout_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymWorkout" ADD CONSTRAINT "GymWorkout_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
