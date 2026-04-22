-- CreateEnum
CREATE TYPE "RecipientScope" AS ENUM ('all', 'departments', 'specific');

-- AlterTable: add scheduledTaskId to Execution
ALTER TABLE "Execution" ADD COLUMN "scheduledTaskId" TEXT;

-- AlterTable: add recipient fields to ScheduledTask
ALTER TABLE "ScheduledTask"
  ADD COLUMN "recipientScope"       "RecipientScope" NOT NULL DEFAULT 'specific',
  ADD COLUMN "recipientDepartments" "Department"[]   NOT NULL DEFAULT ARRAY[]::"Department"[],
  ADD COLUMN "recipientUserIds"     TEXT[]           NOT NULL DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "Notification" (
    "id"          TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "executionId" TEXT,
    "type"        TEXT NOT NULL DEFAULT 'execution_result',
    "title"       TEXT NOT NULL,
    "body"        TEXT,
    "isRead"      BOOLEAN NOT NULL DEFAULT false,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Execution_scheduledTaskId_idx" ON "Execution"("scheduledTaskId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_executionId_idx" ON "Notification"("executionId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_executionId_fkey"
  FOREIGN KEY ("executionId") REFERENCES "Execution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
