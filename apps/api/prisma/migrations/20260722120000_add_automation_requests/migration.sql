-- CreateEnum
CREATE TYPE "AutomationRequestStatus" AS ENUM ('pending', 'review', 'approved', 'in_progress', 'done', 'rejected');

-- CreateEnum
CREATE TYPE "AutomationRequestUrgency" AS ENUM ('low', 'normal', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "AutomationRequestCadence" AS ENUM ('once', 'daily', 'weekly', 'monthly');

-- CreateTable
CREATE TABLE "AutomationRequest" (
    "id" TEXT NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterEmail" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "systemName" TEXT,
    "portalUrl" TEXT,
    "description" TEXT NOT NULL,
    "urgency" "AutomationRequestUrgency" NOT NULL DEFAULT 'normal',
    "cadence" "AutomationRequestCadence" NOT NULL DEFAULT 'once',
    "requiresLogin" BOOLEAN NOT NULL DEFAULT false,
    "requiresCertificate" BOOLEAN NOT NULL DEFAULT false,
    "requiresCaptcha" BOOLEAN NOT NULL DEFAULT false,
    "status" "AutomationRequestStatus" NOT NULL DEFAULT 'pending',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AutomationRequest_status_createdAt_idx" ON "AutomationRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AutomationRequest_requesterUserId_createdAt_idx" ON "AutomationRequest"("requesterUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "AutomationRequest" ADD CONSTRAINT "AutomationRequest_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
