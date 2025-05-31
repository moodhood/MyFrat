-- Step 1: Add column as nullable
ALTER TABLE "Motion" ADD COLUMN "creatorId" INTEGER;

-- Step 2: Set a valid user ID for all existing rows (replace `1` if needed)
UPDATE "Motion" SET "creatorId" = 1;

-- Step 3: Make column NOT NULL
ALTER TABLE "Motion" ALTER COLUMN "creatorId" SET NOT NULL;

-- Step 4: Add the other fields
ALTER TABLE "Motion" 
  ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false,
  ALTER COLUMN "deadline" DROP NOT NULL;

-- Step 5: Add foreign key constraint
ALTER TABLE "Motion" ADD CONSTRAINT "Motion_creatorId_fkey" 
FOREIGN KEY ("creatorId") REFERENCES "User"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;
