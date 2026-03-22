-- AlterTable
ALTER TABLE "DocumentVerification" ADD COLUMN     "exceptionReason" TEXT,
ADD COLUMN     "flaggedAt" TIMESTAMP(3),
ADD COLUMN     "flaggedById" TEXT,
ADD COLUMN     "isException" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "DocumentVerification_isException_idx" ON "DocumentVerification"("isException");
