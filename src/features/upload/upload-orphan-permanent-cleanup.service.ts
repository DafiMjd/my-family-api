import type { Dirent } from "fs";
import fs from "fs/promises";
import path from "path";
import prisma from "@/shared/database/prisma";
import uploadRepository from "./upload.repository";

const PERMANENT_PATH = /^\/uploads\/permanent\/([^/]+)$/;

/** Same rule as upload promotion / repository: only touch expected upload basenames. */
function isSafeUploadBasename(name: string): boolean {
  if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) {
    return false;
  }
  return /^[a-zA-Z0-9._-]+$/.test(name);
}

function parsePermanentBasenameFromUrl(urlString: string): string | null {
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
  } catch {
    return null;
  }
}

export type OrphanPermanentCleanupOptions = {
  /** When true, only report orphans; no files are removed. */
  dryRun: boolean;
  /** If set, only delete orphan files whose mtime is older than this many ms. */
  minAgeMs?: number;
};

export type OrphanPermanentCleanupResult = {
  dryRun: boolean;
  permanentDir: string;
  /** Distinct permanent upload basenames referenced by at least one person. */
  referencedCount: number;
  filesOnDisk: number;
  orphansFound: string[];
  deleted: string[];
  skippedTooNew: string[];
  minAgeMs: number | null;
};

class UploadOrphanPermanentCleanupService {
  async run(options: OrphanPermanentCleanupOptions): Promise<OrphanPermanentCleanupResult> {
    const { dryRun, minAgeMs } = options;
    const permanentDir = uploadRepository.permanentDir();

    const rows = await prisma.person.findMany({
      where: {
        profilePictureUrl: { not: null },
      },
      select: { profilePictureUrl: true },
    });

    const referenced = new Set<string>();
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

    let entries: Dirent[];
    try {
      entries = await fs.readdir(permanentDir, { withFileTypes: true, encoding: "utf8" });
    } catch {
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
    const orphansFound: string[] = [];
    const deleted: string[] = [];
    const skippedTooNew: string[] = [];
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
      const fullPath = path.join(permanentDir, name);

      if (minAgeMs !== undefined && minAgeMs > 0) {
        try {
          const st = await fs.stat(fullPath);
          if (now - st.mtimeMs < minAgeMs) {
            skippedTooNew.push(name);
            continue;
          }
        } catch {
          continue;
        }
      }

      if (!dryRun) {
        try {
          await fs.unlink(fullPath);
          deleted.push(name);
        } catch {
          // race or permission — omit from deleted; caller sees orphansFound vs deleted
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

export default new UploadOrphanPermanentCleanupService();
