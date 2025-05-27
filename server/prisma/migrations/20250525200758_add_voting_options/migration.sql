/*
  Warnings:

  - You are about to drop the column `open` on the `Motion` table. All the data in the column will be lost.
  - Added the required column `deadline` to the `Motion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `optionA` to the `Motion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `optionB` to the `Motion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Motion" DROP COLUMN "open",
ADD COLUMN     "deadline" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "optionA" TEXT NOT NULL,
ADD COLUMN     "optionB" TEXT NOT NULL,
ADD COLUMN     "stopped" BOOLEAN NOT NULL DEFAULT false;
