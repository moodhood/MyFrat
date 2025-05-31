-- DropForeignKey
ALTER TABLE "DutyAssignment" DROP CONSTRAINT "DutyAssignment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Motion" DROP CONSTRAINT "Motion_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "PhilanthropyLog" DROP CONSTRAINT "PhilanthropyLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_motionId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_userId_fkey";

-- AddForeignKey
ALTER TABLE "DutyAssignment" ADD CONSTRAINT "DutyAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhilanthropyLog" ADD CONSTRAINT "PhilanthropyLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Motion" ADD CONSTRAINT "Motion_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_motionId_fkey" FOREIGN KEY ("motionId") REFERENCES "Motion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
