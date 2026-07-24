-- AlterTable
ALTER TABLE "Site" ADD COLUMN "powerbiRefreshStatus" TEXT;
ALTER TABLE "Site" ADD COLUMN "powerbiRefreshRequestId" TEXT;
ALTER TABLE "Site" ADD COLUMN "powerbiLastRefreshAt" TIMESTAMP(3);
