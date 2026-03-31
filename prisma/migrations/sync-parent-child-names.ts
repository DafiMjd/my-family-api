/**
 * Populate / re-sync parentName and childName in the parent_child table.
 *
 * Use this script whenever Person names have been updated and you want
 * the denormalized name columns to reflect the latest values.
 *
 * Run with:
 *   npx ts-node -r tsconfig-paths/register prisma/migrations/sync-parent-child-names.ts
 */

import prisma from "@/shared/database/prisma";

async function main() {
  console.log("=== Sync parent_child names ===\n");

  const rows = await prisma.parentChild.findMany({
    include: {
      parent: { select: { name: true } },
      child:  { select: { name: true } },
    },
  });

  console.log(`Found ${rows.length} row(s) to sync.\n`);

  let updated = 0;
  let skipped = 0;
  let failed  = 0;

  for (const row of rows) {
    const expectedParentName = row.parent.name;
    const expectedChildName  = row.child.name;

    if (row.parentName === expectedParentName && row.childName === expectedChildName) {
      skipped++;
      continue;
    }

    try {
      await prisma.parentChild.update({
        where: { parentId_childId: { parentId: row.parentId, childId: row.childId } },
        data: { parentName: expectedParentName, childName: expectedChildName },
      });
      updated++;
      console.log(`  ✓ Updated: ${row.parentName} → ${expectedParentName}  |  ${row.childName} → ${expectedChildName}`);
    } catch (error) {
      failed++;
      console.error(`  ✗ Failed:  parent=${row.parentId}  child=${row.childId}`, error);
    }
  }

  console.log("\n=== Sync Summary ===");
  console.log(`  Updated : ${updated}`);
  console.log(`  Skipped : ${skipped} (already in sync)`);
  console.log(`  Failed  : ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error("Script crashed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
