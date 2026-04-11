import path from "path";

/**
 * Root directory for user uploads. Pending files live in `<root>/pending/`.
 * Override with `UPLOAD_ROOT` (absolute path recommended on VPS).
 */
export function getUploadRoot(): string {
  return process.env.UPLOAD_ROOT ?? path.join(process.cwd(), "data", "uploads");
}
