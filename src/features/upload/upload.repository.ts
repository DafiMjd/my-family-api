import type { Dirent } from "fs";
import fs from "fs/promises";
import path from "path";
import { getUploadRoot } from "@/shared/config/upload.config";

/** Same rule as upload promotion: only touch expected upload basenames. */
const SAFE_PENDING_BASENAME = /^[a-zA-Z0-9._-]+$/;

export type MovePendingToPermanentResult =
  | "moved"
  | "already_permanent"
  | "unavailable";

class UploadRepository {
  pendingDir(): string {
    return path.join(getUploadRoot(), "pending");
  }

  permanentDir(): string {
    return path.join(getUploadRoot(), "permanent");
  }

  async ensurePendingDir(): Promise<void> {
    await fs.mkdir(this.pendingDir(), { recursive: true });
  }

  /**
   * Moves `<root>/pending/<filename>` → `<root>/permanent/<filename>`.
   * Idempotent if the file is already under permanent.
   */
  async movePendingToPermanent(filename: string): Promise<MovePendingToPermanentResult> {
    const pendingPath = path.join(this.pendingDir(), filename);
    const destDir = this.permanentDir();
    const permanentPath = path.join(destDir, filename);

    await fs.mkdir(destDir, { recursive: true });

    let destExists = false;
    try {
      await fs.access(permanentPath);
      destExists = true;
    } catch {
      destExists = false;
    }

    let pendingExists = false;
    try {
      await fs.access(pendingPath);
      pendingExists = true;
    } catch {
      pendingExists = false;
    }

    if (!pendingExists && !destExists) {
      return "unavailable";
    }

    if (destExists) {
      if (pendingExists) {
        await fs.unlink(pendingPath).catch(() => {});
      }
      return "already_permanent";
    }

    try {
      await fs.rename(pendingPath, permanentPath);
      return "moved";
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "EXDEV") {
        await fs.copyFile(pendingPath, permanentPath);
        await fs.unlink(pendingPath);
        return "moved";
      }
      throw err;
    }
  }

  /**
   * Deletes regular files in `pending/` whose mtime is older than `maxAgeMs` (relative to now).
   * Skips unexpected names (non-basenames / odd paths).
   */
  async purgePendingFilesOlderThan(maxAgeMs: number): Promise<number> {
    const dir = this.pendingDir();
    let deleted = 0;
    let entries: Dirent[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true, encoding: "utf8" });
    } catch {
      return 0;
    }

    const now = Date.now();

    for (const ent of entries) {
      if (!ent.isFile()) {
        continue;
      }
      const name = String(ent.name);
      if (!SAFE_PENDING_BASENAME.test(name)) {
        continue;
      }

      const fullPath = path.join(dir, name);
      try {
        const st = await fs.stat(fullPath);
        if (!st.isFile()) {
          continue;
        }
        const ageMs = now - st.mtimeMs;
        if (ageMs > maxAgeMs) {
          await fs.unlink(fullPath);
          deleted += 1;
        }
      } catch {
        // race: file removed between readdir and stat/unlink — ignore
      }
    }

    return deleted;
  }
}

export default new UploadRepository();
