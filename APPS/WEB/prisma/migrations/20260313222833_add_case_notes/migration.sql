-- CreateTable
CREATE TABLE "CaseNote" (
    "id" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CaseNote_verificationId_idx" ON "CaseNote"("verificationId");

-- CreateIndex
CREATE INDEX "CaseNote_staffId_idx" ON "CaseNote"("staffId");

-- CreateIndex
CREATE INDEX "CaseNote_residentId_idx" ON "CaseNote"("residentId");

-- CreateIndex
CREATE INDEX "CaseNote_createdAt_idx" ON "CaseNote"("createdAt");

-- CreateIndex
CREATE INDEX "DocumentVerification_isActive_idx" ON "DocumentVerification"("isActive");

-- AddForeignKey
ALTER TABLE "CaseNote" ADD CONSTRAINT "CaseNote_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "DocumentVerification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseNote" ADD CONSTRAINT "CaseNote_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseNote" ADD CONSTRAINT "CaseNote_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
