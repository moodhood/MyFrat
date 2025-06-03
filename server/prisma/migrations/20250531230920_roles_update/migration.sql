/*
  Warnings:

  - Made the column `displayName` on table `Role` required. This step will fail if there are existing NULL values in that column.
  - To prevent that, first backfill any NULL `displayName` entries.
*/

-- 1) Backfill any NULL displayName to use the role’s name
UPDATE "Role"
SET "displayName" = "name"
WHERE "displayName" IS NULL;

-- 2) Now make displayName NOT NULL
ALTER TABLE "Role" ALTER COLUMN "displayName" SET NOT NULL;
