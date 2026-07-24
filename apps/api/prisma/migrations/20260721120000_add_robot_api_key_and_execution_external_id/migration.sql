-- AlterTable Robot: suporte a automações externas reportando via API
ALTER TABLE "Robot" ADD COLUMN "isExternal" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Robot" ADD COLUMN "apiKeyHash" TEXT;
CREATE UNIQUE INDEX "Robot_apiKeyHash_key" ON "Robot"("apiKeyHash");

-- AlterTable Execution: idempotência para execuções reportadas externamente
ALTER TABLE "Execution" ADD COLUMN "externalId" TEXT;
CREATE UNIQUE INDEX "Execution_robotId_externalId_key" ON "Execution"("robotId", "externalId");
