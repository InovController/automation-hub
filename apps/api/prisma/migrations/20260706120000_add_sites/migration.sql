-- CreateEnum
CREATE TYPE "SiteStatus" AS ENUM ('online', 'maintenance', 'down');

-- CreateTable
CREATE TABLE "Site" (
    "id"                  TEXT NOT NULL,
    "slug"                TEXT NOT NULL,
    "name"                TEXT NOT NULL,
    "url"                 TEXT NOT NULL,
    "description"         TEXT,
    "status"              "SiteStatus" NOT NULL DEFAULT 'online',
    "maintenanceOverride" BOOLEAN NOT NULL DEFAULT false,
    "order"               INTEGER NOT NULL DEFAULT 0,
    "lastCheckedAt"       TIMESTAMP(3),
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Site_slug_key" ON "Site"("slug");
