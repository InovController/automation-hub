CREATE TABLE "ExternalIdentity" (
    "login" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalIdentity_pkey" PRIMARY KEY ("login")
);

CREATE INDEX "ExternalIdentity_department_idx" ON "ExternalIdentity"("department");
