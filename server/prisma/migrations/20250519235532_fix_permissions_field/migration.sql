-- 1) Create the Role table first (so we can backfill)
CREATE TABLE "Role" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "permissions" JSONB NOT NULL DEFAULT '[]'
);

-- 2) Insert a default “Member” role
INSERT INTO "Role" ("name","permissions")
VALUES ('Member','[]');

-- 3) Now add roleId as NULLABLE (drop the NOT NULL)
ALTER TABLE "User" ADD COLUMN "roleId" INTEGER;

-- 4) Backfill every existing user to the “Member” role
UPDATE "User"
SET "roleId" = (SELECT id FROM "Role" WHERE name = 'Member');

-- 5) Alter it to NOT NULL now that everyone has a value
ALTER TABLE "User" ALTER COLUMN "roleId" SET NOT NULL;

-- 6) Finally add the foreign‐key constraint
ALTER TABLE "User"
  ADD CONSTRAINT "User_roleId_fkey"
  FOREIGN KEY ("roleId") REFERENCES "Role"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- 7) Create the rest of your tables as Prisma generated them:
-- (Motion, Vote, EventCategory, Event, DutyAssignment, PhilanthropyLog, indexes, FKs…)

CREATE TYPE "EventCategory" AS ENUM ('PHILANTHROPY','BROTHERHOOD','ADMIN','OTHER');

CREATE TABLE "Motion" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "open" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Vote" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "motionId" INTEGER NOT NULL,
  "choice" BOOLEAN NOT NULL,
  "castAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Event" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "location" TEXT,
  "start" TIMESTAMP(3) NOT NULL,
  "end" TIMESTAMP(3) NOT NULL,
  "category" "EventCategory" NOT NULL
);

CREATE TABLE "DutyAssignment" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "completed" BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE "PhilanthropyLog" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "organization" TEXT NOT NULL,
  "hours" INTEGER NOT NULL,
  "notes" TEXT
);

-- Indexes
CREATE UNIQUE INDEX "Vote_userId_motionId_key" ON "Vote"("userId","motionId");

-- Foreign keys for the new tables
ALTER TABLE "Vote"
  ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "Vote_motionId_fkey" FOREIGN KEY ("motionId") REFERENCES "Motion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DutyAssignment"
  ADD CONSTRAINT "DutyAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PhilanthropyLog"
  ADD CONSTRAINT "PhilanthropyLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
