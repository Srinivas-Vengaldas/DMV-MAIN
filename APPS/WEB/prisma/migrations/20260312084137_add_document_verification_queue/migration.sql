-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VerificationAiStatus" AS ENUM ('PENDING', 'TIMED_OUT', 'APPROVED_BY_AI', 'APPROVED_BY_STAFF', 'REJECTED_BY_STAFF');

-- CreateEnum
CREATE TYPE "StaffAction" AS ENUM ('APPROVED', 'REJECTED', 'NOTE_ADDED');

-- CreateTable
CREATE TABLE "DocumentVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "aiStatus" "VerificationAiStatus" NOT NULL DEFAULT 'PENDING',
    "isStaffReview" BOOLEAN NOT NULL DEFAULT false,
    "aiConfidence" DOUBLE PRECISION,
    "ocrText" TEXT,
    "extractedFields" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentToStaffAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffActivity" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "action" "StaffAction" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentVerification_userId_idx" ON "DocumentVerification"("userId");

-- CreateIndex
CREATE INDEX "DocumentVerification_applicationId_idx" ON "DocumentVerification"("applicationId");

-- CreateIndex
CREATE INDEX "DocumentVerification_status_idx" ON "DocumentVerification"("status");

-- CreateIndex
CREATE INDEX "DocumentVerification_isStaffReview_idx" ON "DocumentVerification"("isStaffReview");

-- CreateIndex
CREATE INDEX "DocumentVerification_submittedAt_idx" ON "DocumentVerification"("submittedAt");

-- CreateIndex
CREATE INDEX "StaffActivity_staffId_idx" ON "StaffActivity"("staffId");

-- CreateIndex
CREATE INDEX "StaffActivity_verificationId_idx" ON "StaffActivity"("verificationId");

-- CreateIndex
CREATE INDEX "StaffActivity_createdAt_idx" ON "StaffActivity"("createdAt");

-- AddForeignKey
ALTER TABLE "DocumentVerification" ADD CONSTRAINT "DocumentVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVerification" ADD CONSTRAINT "DocumentVerification_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVerification" ADD CONSTRAINT "DocumentVerification_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffActivity" ADD CONSTRAINT "StaffActivity_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffActivity" ADD CONSTRAINT "StaffActivity_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "DocumentVerification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
