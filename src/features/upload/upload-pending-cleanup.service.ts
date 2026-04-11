import uploadRepository from "./upload.repository";
import {
  getPendingCleanupIntervalMs,
  getPendingUploadTtlMs,
  isPendingUploadCleanupEnabled,
} from "@/shared/config/upload-cleanup.config";

/**
 * Periodic removal of orphaned files under `pending/` (TTL since last mtime).
 */
class UploadPendingCleanupService {
  private timer: ReturnType<typeof setInterval> | null = null;

  start(): void {
    if (!isPendingUploadCleanupEnabled()) {
      console.log(
        "[upload-cleanup] Pending TTL job disabled (set UPLOAD_PENDING_CLEANUP_ENABLED=false to skip)"
      );
      return;
    }

    if (this.timer !== null) {
      return;
    }

    const ttlMs = getPendingUploadTtlMs();
    const intervalMs = getPendingCleanupIntervalMs();
    console.log(
      `[upload-cleanup] Pending uploads: TTL=${ttlMs}ms, run every ${intervalMs}ms`
    );

    void this.runOnce().catch((err) => {
      console.error("[upload-cleanup] Initial run failed:", err);
    });

    this.timer = setInterval(() => {
      void this.runOnce().catch((err) => {
        console.error("[upload-cleanup] Scheduled run failed:", err);
      });
    }, intervalMs);
  }

  /** One pass: delete pending files older than configured TTL. */
  async runOnce(): Promise<number> {
    const ttlMs = getPendingUploadTtlMs();
    const removed = await uploadRepository.purgePendingFilesOlderThan(ttlMs);
    if (removed > 0) {
      console.log(`[upload-cleanup] Removed ${removed} expired pending file(s)`);
    }
    return removed;
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export default new UploadPendingCleanupService();
