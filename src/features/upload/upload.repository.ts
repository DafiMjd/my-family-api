import fs from "fs/promises";
import path from "path";
import { getUploadRoot } from "@/shared/config/upload.config";

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
}

export default new UploadRepository();
