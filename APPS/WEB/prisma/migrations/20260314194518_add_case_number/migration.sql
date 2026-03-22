/*
  Warnings:

  - A unique constraint covering the columns `[caseNumber]` on the table `DocumentVerification` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "DocumentVerification" ADD COLUMN     "caseNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVerification_caseNumber_key" ON "DocumentVerification"("caseNumber");
