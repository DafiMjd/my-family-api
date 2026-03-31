/**
 * Phase 2 Data Migration Script
 *
 * Migrates existing PARENT-type rows from the `relationships` table
 * into the new `parent_child` table with type BIOLOGICAL.
 *
 * Safe to run multiple times — skips rows that already exist.
 *
 * Run with:
 *   npx ts-node -r tsconfig-paths/register prisma/migrations/migrate-parent-child.ts
 */

import prisma from "@/shared/database/prisma";
import { ParentType } from "@prisma/client";

async function main() {
  console.log("=== Phase 2: Parent-Child Data Migration ===\n");

  // Fetch all PARENT-direction rows only (CHILD rows are the same data duplicated)
  const parentRelationships = await prisma.relationship.findMany({
    where: { type: "PARENT" },
    select: { personId: true, relatedPersonId: true },
  });

  console.log(`Found ${parentRelationships.length} PARENT relationship(s) to migrate.\n`);

  if (parentRelationships.length === 0) {
    console.log("Nothing to migrate. Exiting.");
    return;
  }

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const rel of parentRelationships) {
    const { personId: parentId, relatedPersonId: childId } = rel;

    try {
      await prisma.parentChild.upsert({
        where: { parentId_childId: { parentId, childId } },
        update: {},
        create: { parentId, childId, type: ParentType.BIOLOGICAL },
      });
      migrated++;
      console.log(`  ✓ Migrated: parent=${parentId}  child=${childId}`);
    } catch (error) {
      failed++;
      console.error(`  ✗ Failed:   parent=${parentId}  child=${childId}`, error);
    }
  }

  console.log("\n=== Migration Summary ===");
  console.log(`  Migrated : ${migrated}`);
  console.log(`  Skipped  : ${skipped}`);
  console.log(`  Failed   : ${failed}`);

  if (failed > 0) {
    console.error("\nSome rows failed. Do NOT proceed to Phase 4 until all are resolved.");
    process.exit(1);
  } else {
    console.log("\nAll rows migrated successfully. Ready for Phase 3 (verify).");
  }
}

main()
  .catch((error) => {
    console.error("Migration script crashed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
