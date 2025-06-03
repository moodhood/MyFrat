/*
  Warnings:

  - You are about to drop the `DutyAssignment` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `lastSeen` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "DutyAssignment" DROP CONSTRAINT "DutyAssignment_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'member',
ALTER COLUMN "lastSeen" SET NOT NULL;

-- DropTable
DROP TABLE "DutyAssignment";

-- CreateTable
CREATE TABLE "Chore" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "frequency" TEXT NOT NULL DEFAULT 'weekly',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChoreAssignee" (
    "id" SERIAL NOT NULL,
    "choreId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "ChoreAssignee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChoreAssignment" (
    "id" SERIAL NOT NULL,
    "choreId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ChoreAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChoreAssignee_choreId_userId_key" ON "ChoreAssignee"("choreId", "userId");

-- CreateIndex
CREATE INDEX "ChoreAssignment_choreId_date_idx" ON "ChoreAssignment"("choreId", "date");

-- AddForeignKey
ALTER TABLE "ChoreAssignee" ADD CONSTRAINT "ChoreAssignee_choreId_fkey" FOREIGN KEY ("choreId") REFERENCES "Chore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreAssignee" ADD CONSTRAINT "ChoreAssignee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreAssignment" ADD CONSTRAINT "ChoreAssignment_choreId_fkey" FOREIGN KEY ("choreId") REFERENCES "Chore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreAssignment" ADD CONSTRAINT "ChoreAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
