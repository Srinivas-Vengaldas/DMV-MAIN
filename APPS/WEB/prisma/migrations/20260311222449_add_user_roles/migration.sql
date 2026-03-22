-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('RESIDENT', 'STAFF', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'RESIDENT';
