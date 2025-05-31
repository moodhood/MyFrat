/*
  Warnings:

  - You are about to drop the column `deadline` on the `Motion` table. All the data in the column will be lost.
  - You are about to drop the column `optionA` on the `Motion` table. All the data in the column will be lost.
  - You are about to drop the column `optionB` on the `Motion` table. All the data in the column will be lost.
  - Added the required column `options` to the `Motion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Motion" DROP COLUMN "deadline",
DROP COLUMN "optionA",
DROP COLUMN "optionB",
ADD COLUMN     "options" JSONB NOT NULL,
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Vote" ALTER COLUMN "choice" SET DATA TYPE TEXT;
