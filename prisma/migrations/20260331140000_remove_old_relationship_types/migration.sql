-- ============================================================
-- Phase 4: Remove PARENT/CHILD from RelationshipType and
--          replace FATHER/MOTHER with PARENT in FamilyMemberRole
-- ============================================================

-- ============================================================
-- Step 1: Alter RelationshipType enum (remove PARENT and CHILD)
-- ============================================================

-- 1a. Delete PARENT/CHILD rows — already migrated to parent_child in Phase 2
DELETE FROM "public"."relationships" WHERE "type" IN ('PARENT', 'CHILD');

-- 1b. Rebuild enum with only SPOUSE
CREATE TYPE "public"."RelationshipType_new" AS ENUM ('SPOUSE');

ALTER TABLE "public"."relationships"
  ALTER COLUMN "type" TYPE "public"."RelationshipType_new"
  USING ("type"::text::"public"."RelationshipType_new");

DROP TYPE "public"."RelationshipType";
ALTER TYPE "public"."RelationshipType_new" RENAME TO "RelationshipType";

-- ============================================================
-- Step 2: Alter FamilyMemberRole enum
--         Use CASE in USING clause to map old → new values
--         without needing ALTER TYPE ADD VALUE (which cannot
--         be used in the same transaction)
-- ============================================================

CREATE TYPE "public"."FamilyMemberRole_new" AS ENUM ('PARENT', 'CHILD');

ALTER TABLE "public"."family_members"
  ALTER COLUMN "role" TYPE "public"."FamilyMemberRole_new"
  USING (
    CASE "role"::text
      WHEN 'FATHER' THEN 'PARENT'
      WHEN 'MOTHER' THEN 'PARENT'
      ELSE "role"::text
    END
  )::"public"."FamilyMemberRole_new";

DROP TYPE "public"."FamilyMemberRole";
ALTER TYPE "public"."FamilyMemberRole_new" RENAME TO "FamilyMemberRole";
