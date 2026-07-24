-- AlterTable
ALTER TABLE "Execution" ADD COLUMN "cleanedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Execution_createdAt_idx" ON "Execution"("createdAt");

-- CreateIndex
CREATE INDEX "Execution_cleanedAt_finishedAt_idx" ON "Execution"("cleanedAt", "finishedAt");
