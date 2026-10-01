-- CreateTable
CREATE TABLE "BroadcastPushSent" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "recipientCount" INTEGER NOT NULL,
    "sentByTrainerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BroadcastPushSent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BroadcastPushSent_sentByTrainerId_idx" ON "BroadcastPushSent"("sentByTrainerId");

-- AddForeignKey
ALTER TABLE "BroadcastPushSent" ADD CONSTRAINT "BroadcastPushSent_sentByTrainerId_fkey" FOREIGN KEY ("sentByTrainerId") REFERENCES "Trainer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
