-- AlterTable: add optional athenasLogin field for Firebird SSO
ALTER TABLE "User" ADD COLUMN "athenasLogin" TEXT;

-- CreateIndex: unique constraint
CREATE UNIQUE INDEX "User_athenasLogin_key" ON "User"("athenasLogin");
