/**
 * CLI: remove files under <UPLOAD_ROOT>/permanent that are not referenced by any Person.profilePictureUrl.
 *
 * Usage:
 *   npm run uploads:cleanup-permanent-orphans -- --dry-run
 *   npm run uploads:cleanup-permanent-orphans -- --execute
 *   npm run uploads:cleanup-permanent-orphans -- --execute --min-age-minutes=10
 *
 * Default is --dry-run if neither flag is passed.
 */
import "dotenv/config";
import prisma from "@/shared/database/prisma";
import uploadOrphanPermanentCleanupService from "@/features/upload/upload-orphan-permanent-cleanup.service";

function parseArgs(argv: string[]): { execute: boolean; minAgeMinutes: number | undefined } {
  let execute = false;
  let dryRun = false;
  let minAgeMinutes: number | undefined;

  for (const arg of argv) {
    if (arg === "--execute") {
      execute = true;
    }
    if (arg === "--dry-run") {
      dryRun = true;
    }
    const m = arg.match(/^--min-age-minutes=(\d+(?:\.\d+)?)$/);
    if (m) {
      minAgeMinutes = Number(m[1]);
    }
  }

  if (!execute && !dryRun) {
    dryRun = true;
  }
  if (execute && dryRun) {
    console.error("Use only one of --execute or --dry-run");
    process.exit(1);
  }

  return { execute, minAgeMinutes };
}

async function main(): Promise<void> {
  const { execute, minAgeMinutes } = parseArgs(process.argv.slice(2));
  const dryRun = !execute;
  const minAgeMs =
    minAgeMinutes !== undefined && Number.isFinite(minAgeMinutes) && minAgeMinutes >= 0
      ? Math.round(minAgeMinutes * 60_000)
      : undefined;

  if (minAgeMinutes !== undefined && (!Number.isFinite(minAgeMinutes) || minAgeMinutes < 0)) {
    console.error("min-age-minutes must be a non-negative number");
    process.exit(1);
  }

  const result = await uploadOrphanPermanentCleanupService.run({
    dryRun,
    minAgeMs,
  });

  console.log(JSON.stringify(result, null, 2));
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
