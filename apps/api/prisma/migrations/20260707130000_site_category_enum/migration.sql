-- CreateEnum
CREATE TYPE "SiteCategory" AS ENUM ('sistema', 'bi');

-- AlterTable: converte a categoria livre em texto para as duas opções fixas (sistema/bi)
ALTER TABLE "Site" ADD COLUMN "category_new" "SiteCategory" NOT NULL DEFAULT 'sistema';

UPDATE "Site" SET "category_new" = 'bi' WHERE lower("category") = 'bi';

ALTER TABLE "Site" DROP COLUMN "category";
ALTER TABLE "Site" RENAME COLUMN "category_new" TO "category";
