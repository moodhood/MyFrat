/*
  Warnings:

  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Chore` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChoreAssignee` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChoreAssignment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ChoreAssignee" DROP CONSTRAINT "ChoreAssignee_choreId_fkey";

-- DropForeignKey
ALTER TABLE "ChoreAssignee" DROP CONSTRAINT "ChoreAssignee_userId_fkey";

-- DropForeignKey
ALTER TABLE "ChoreAssignment" DROP CONSTRAINT "ChoreAssignment_choreId_fkey";

-- DropForeignKey
ALTER TABLE "ChoreAssignment" DROP CONSTRAINT "ChoreAssignment_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ALTER COLUMN "lastSeen" DROP NOT NULL;

-- DropTable
DROP TABLE "Chore";

-- DropTable
DROP TABLE "ChoreAssignee";

-- DropTable
DROP TABLE "ChoreAssignment";

-- CreateTable
CREATE TABLE "Duty" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "currentIndex" INTEGER NOT NULL DEFAULT 0,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Duty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DutyMember" (
    "id" SERIAL NOT NULL,
    "dutyId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "DutyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DutyAssignment" (
    "id" SERIAL NOT NULL,
    "dutyId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "weekOf" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" TIMESTAMP(3),

    CONSTRAINT "DutyAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DutyMember_dutyId_order_idx" ON "DutyMember"("dutyId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "DutyMember_dutyId_userId_key" ON "DutyMember"("dutyId", "userId");

-- CreateIndex
CREATE INDEX "DutyAssignment_userId_weekOf_idx" ON "DutyAssignment"("userId", "weekOf");

-- CreateIndex
CREATE INDEX "DutyAssignment_dutyId_weekOf_idx" ON "DutyAssignment"("dutyId", "weekOf");

-- AddForeignKey
ALTER TABLE "DutyMember" ADD CONSTRAINT "DutyMember_dutyId_fkey" FOREIGN KEY ("dutyId") REFERENCES "Duty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyMember" ADD CONSTRAINT "DutyMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyAssignment" ADD CONSTRAINT "DutyAssignment_dutyId_fkey" FOREIGN KEY ("dutyId") REFERENCES "Duty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyAssignment" ADD CONSTRAINT "DutyAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
