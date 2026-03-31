-- Add parentName and childName to parent_child
-- Existing rows are backfilled from the persons table before enforcing NOT NULL

-- Step 1: Add columns as nullable
ALTER TABLE "public"."parent_child" ADD COLUMN "parentName" VARCHAR(100);
ALTER TABLE "public"."parent_child" ADD COLUMN "childName"  VARCHAR(100);

-- Step 2: Populate from persons table
UPDATE "public"."parent_child" pc
SET
  "parentName" = p.name,
  "childName"  = c.name
FROM
  "public"."persons" p,
  "public"."persons" c
WHERE
  pc."parentId" = p.id
  AND pc."childId" = c.id;

-- Step 3: Enforce NOT NULL now that all rows are filled
ALTER TABLE "public"."parent_child" ALTER COLUMN "parentName" SET NOT NULL;
ALTER TABLE "public"."parent_child" ALTER COLUMN "childName"  SET NOT NULL;
