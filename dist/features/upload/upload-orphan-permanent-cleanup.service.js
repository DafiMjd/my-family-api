"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const prisma_1 = __importDefault(require("../../shared/database/prisma"));
const upload_repository_1 = __importDefault(require("./upload.repository"));
const PERMANENT_PATH = /^\/uploads\/permanent\/([^/]+)$/;
function isSafeUploadBasename(name) {
    if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) {
        return false;
    }
    return /^[a-zA-Z0-9._-]+$/.test(name);
}
function parsePermanentBasenameFromUrl(urlString) {
    try {
        const u = new URL(urlString);
        const m = u.pathname.match(PERMANENT_PATH);
        if (!m?.[1]) {
            return null;
        }
        const decoded = decodeURIComponent(m[1]);
        if (!isSafeUploadBasename(decoded)) {
            return null;
        }
        return decoded;
    }
    catch {
        return null;
    }
}
class UploadOrphanPermanentCleanupService {
    async run(options) {
        const { dryRun, minAgeMs } = options;
        const permanentDir = upload_repository_1.default.permanentDir();
        const rows = await prisma_1.default.person.findMany({
            where: {
                profilePictureUrl: { not: null },
            },
            select: { profilePictureUrl: true },
        });
        const referenced = new Set();
        for (const row of rows) {
            const url = row.profilePictureUrl?.trim();
            if (!url) {
                continue;
            }
            const basename = parsePermanentBasenameFromUrl(url);
            if (basename) {
                referenced.add(basename);
            }
        }
        let entries;
        try {
            entries = await promises_1.default.readdir(permanentDir, { withFileTypes: true, encoding: "utf8" });
        }
        catch {
            return {
                dryRun,
                permanentDir,
                referencedCount: referenced.size,
                filesOnDisk: 0,
                orphansFound: [],
                deleted: [],
                skippedTooNew: [],
                minAgeMs: minAgeMs ?? null,
            };
        }
        const now = Date.now();
        const orphansFound = [];
        const deleted = [];
        const skippedTooNew = [];
        let filesOnDisk = 0;
        for (const ent of entries) {
            if (!ent.isFile()) {
                continue;
            }
            const name = String(ent.name);
            if (!isSafeUploadBasename(name)) {
                continue;
            }
            filesOnDisk += 1;
            if (referenced.has(name)) {
                continue;
            }
            orphansFound.push(name);
            const fullPath = path_1.default.join(permanentDir, name);
            if (minAgeMs !== undefined && minAgeMs > 0) {
                try {
                    const st = await promises_1.default.stat(fullPath);
                    if (now - st.mtimeMs < minAgeMs) {
                        skippedTooNew.push(name);
                        continue;
                    }
                }
                catch {
                    continue;
                }
            }
            if (!dryRun) {
                try {
                    await promises_1.default.unlink(fullPath);
                    deleted.push(name);
                }
                catch {
                }
            }
        }
        return {
            dryRun,
            permanentDir,
            referencedCount: referenced.size,
            filesOnDisk,
            orphansFound,
            deleted,
            skippedTooNew,
            minAgeMs: minAgeMs ?? null,
        };
    }
}
exports.default = new UploadOrphanPermanentCleanupService();
//# sourceMappingURL=upload-orphan-permanent-cleanup.service.js.map