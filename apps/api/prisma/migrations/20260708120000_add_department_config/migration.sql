-- CreateTable
CREATE TABLE "DepartmentConfig" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DepartmentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentConfig_slug_key" ON "DepartmentConfig"("slug");

-- Seed initial departments
INSERT INTO "DepartmentConfig" ("id", "slug", "name", "isActive", "order", "createdAt", "updatedAt") VALUES
('dept_pessoal',      'pessoal',      'Pessoal',       true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('dept_fiscal',       'fiscal',       'Fiscal',        true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('dept_contabil',     'contabil',     'Contábil',      true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('dept_tecnologia',   'tecnologia',   'Tecnologia',    true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('dept_inovacao',     'inovacao',     'Inovação',      true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('dept_legalizacao',  'legalizacao',  'Legalização',   true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('dept_certificacao', 'certificacao', 'Certificação',  true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('dept_auditoria',    'auditoria',    'Auditoria',     true, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('dept_rh',           'rh',           'RH',            true, 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Cast Department[] enum arrays to TEXT[] on all tables
ALTER TABLE "User" ALTER COLUMN "departments" TYPE TEXT[] USING "departments"::text[];
ALTER TABLE "Robot" ALTER COLUMN "allowedDepartments" TYPE TEXT[] USING "allowedDepartments"::text[];
ALTER TABLE "Site" ALTER COLUMN "allowedDepartments" TYPE TEXT[] USING "allowedDepartments"::text[];
ALTER TABLE "ScheduledTask" ALTER COLUMN "recipientDepartments" TYPE TEXT[] USING "recipientDepartments"::text[];

-- Drop Department enum (no longer needed)
DROP TYPE IF EXISTS "Department";
