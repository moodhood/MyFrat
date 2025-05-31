-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailConfirmCode" TEXT,
ADD COLUMN     "emailConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);
