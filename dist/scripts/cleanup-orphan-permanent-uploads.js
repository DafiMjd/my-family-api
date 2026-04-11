"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const prisma_1 = __importDefault(require("../shared/database/prisma"));
const upload_orphan_permanent_cleanup_service_1 = __importDefault(require("../features/upload/upload-orphan-permanent-cleanup.service"));
function parseArgs(argv) {
    let execute = false;
    let dryRun = false;
    let minAgeMinutes;
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
async function main() {
    const { execute, minAgeMinutes } = parseArgs(process.argv.slice(2));
    const dryRun = !execute;
    const minAgeMs = minAgeMinutes !== undefined && Number.isFinite(minAgeMinutes) && minAgeMinutes >= 0
        ? Math.round(minAgeMinutes * 60000)
        : undefined;
    if (minAgeMinutes !== undefined && (!Number.isFinite(minAgeMinutes) || minAgeMinutes < 0)) {
        console.error("min-age-minutes must be a non-negative number");
        process.exit(1);
    }
    const result = await upload_orphan_permanent_cleanup_service_1.default.run({
        dryRun,
        minAgeMs,
    });
    console.log(JSON.stringify(result, null, 2));
    await prisma_1.default.$disconnect();
}
main().catch(async (err) => {
    console.error(err);
    await prisma_1.default.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=cleanup-orphan-permanent-uploads.js.map