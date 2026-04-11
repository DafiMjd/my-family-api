/**
 * Pending-upload TTL cleanup (orphaned files under `<UPLOAD_ROOT>/pending/`).
 *
 * Defaults are tuned for local testing (short TTL + frequent runs).
 * On VPS, set e.g. `UPLOAD_PENDING_TTL_MS=172800000` (48h) and a longer interval.
 */

function parsePositiveIntEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw === "") {
    return fallback;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    return fallback;
  }
  return Math.floor(n);
}

/** Max age (mtime) for a file in `pending/` before it is deleted. Default: 2 minutes (testing). */
export function getPendingUploadTtlMs(): number {
  return parsePositiveIntEnv("UPLOAD_PENDING_TTL_MS", 20 * 60 * 1000); // 20 minutes
}

/** How often the cleanup job runs. Default: every 1 minute (testing). */
export function getPendingCleanupIntervalMs(): number {
  return parsePositiveIntEnv("UPLOAD_PENDING_CLEANUP_INTERVAL_MS", 12 * 60 * 60 * 1000); // 12 hours
}

export function isPendingUploadCleanupEnabled(): boolean {
  const v = process.env.UPLOAD_PENDING_CLEANUP_ENABLED?.toLowerCase();
  return v !== "false" && v !== "0";
}
