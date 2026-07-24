CREATE TABLE "PowerBIRefreshLog" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "requestedByName" TEXT,
    "requestedByEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Unknown',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "PowerBIRefreshLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PowerBIRefreshLog" ADD CONSTRAINT "PowerBIRefreshLog_siteId_fkey"
    FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "PowerBIRefreshLog_siteId_requestedAt_idx" ON "PowerBIRefreshLog"("siteId", "requestedAt");
CREATE INDEX "PowerBIRefreshLog_requestedAt_idx" ON "PowerBIRefreshLog"("requestedAt");
