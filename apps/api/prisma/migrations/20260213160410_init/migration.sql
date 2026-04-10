-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('queued', 'running', 'success', 'error', 'canceled');

-- CreateEnum
CREATE TYPE "ScheduleFrequency" AS ENUM ('once', 'daily', 'weekly', 'monthly');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'manager', 'employee');

-- CreateEnum
CREATE TYPE "Department" AS ENUM ('pessoal', 'fiscal', 'contabil', 'tecnologia', 'inovacao', 'legalizacao', 'certificacao', 'auditoria', 'rh');

-- CreateTable
CREATE TABLE "Robot" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "category" TEXT,
    "icon" TEXT DEFAULT 'bot',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "estimatedMinutes" INTEGER,
    "maxConcurrency" INTEGER NOT NULL DEFAULT 1,
    "conflictKeys" TEXT,
    "manualSecondsPerUnit" INTEGER NOT NULL DEFAULT 0,
    "unitLabel" TEXT DEFAULT 'item',
    "unitMetricKey" TEXT DEFAULT 'itens_processados',
    "command" TEXT,
    "workingDirectory" TEXT,
    "allowedDepartments" "Department"[] DEFAULT ARRAY[]::"Department"[],
    "schema" JSONB,
    "documentationUrl" TEXT,
    "documentationLabel" TEXT,
    "supportLabel" TEXT,
    "supportValue" TEXT,
    "dataPolicy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Robot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'employee',
    "departments" "Department"[] DEFAULT ARRAY[]::"Department"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Execution" (
    "id" TEXT NOT NULL,
    "robotId" TEXT NOT NULL,
    "userId" TEXT,
    "requestedByName" TEXT,
    "requestedByEmail" TEXT,
    "notes" TEXT,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'queued',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "currentStep" TEXT,
    "inputJson" JSONB,
    "unitsProcessed" INTEGER,
    "manualEstimatedSeconds" INTEGER,
    "errorMessage" TEXT,
    "outputZipPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),

    CONSTRAINT "Execution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutionLog" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'info',
    "message" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExecutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutionFile" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'output',
    "filename" TEXT NOT NULL,
    "originalName" TEXT,
    "storagePath" TEXT NOT NULL,
    "downloadName" TEXT,
    "mimeType" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExecutionFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledTask" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "robotId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "frequency" "ScheduleFrequency" NOT NULL,
    "timeOfDay" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "notes" TEXT,
    "parameters" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3) NOT NULL,
    "lastError" TEXT,
    "lastExecutionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RobotInputExample" (
    "id" TEXT NOT NULL,
    "robotId" TEXT NOT NULL,
    "fileInputName" TEXT,
    "title" TEXT,
    "description" TEXT,
    "filename" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "downloadName" TEXT,
    "mimeType" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RobotInputExample_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Robot_slug_key" ON "Robot"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "Execution_robotId_idx" ON "Execution"("robotId");

-- CreateIndex
CREATE INDEX "Execution_userId_createdAt_idx" ON "Execution"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Execution_status_createdAt_idx" ON "Execution"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ExecutionLog_executionId_timestamp_idx" ON "ExecutionLog"("executionId", "timestamp");

-- CreateIndex
CREATE INDEX "ExecutionFile_executionId_createdAt_idx" ON "ExecutionFile"("executionId", "createdAt");

-- CreateIndex
CREATE INDEX "ScheduledTask_isActive_nextRunAt_idx" ON "ScheduledTask"("isActive", "nextRunAt");

-- CreateIndex
CREATE INDEX "ScheduledTask_userId_createdAt_idx" ON "ScheduledTask"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ScheduledTask_robotId_createdAt_idx" ON "ScheduledTask"("robotId", "createdAt");

-- CreateIndex
CREATE INDEX "RobotInputExample_robotId_createdAt_idx" ON "RobotInputExample"("robotId", "createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Execution" ADD CONSTRAINT "Execution_robotId_fkey" FOREIGN KEY ("robotId") REFERENCES "Robot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Execution" ADD CONSTRAINT "Execution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutionLog" ADD CONSTRAINT "ExecutionLog_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "Execution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutionFile" ADD CONSTRAINT "ExecutionFile_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "Execution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledTask" ADD CONSTRAINT "ScheduledTask_robotId_fkey" FOREIGN KEY ("robotId") REFERENCES "Robot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledTask" ADD CONSTRAINT "ScheduledTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RobotInputExample" ADD CONSTRAINT "RobotInputExample_robotId_fkey" FOREIGN KEY ("robotId") REFERENCES "Robot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
