"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPendingUploadTtlMs = getPendingUploadTtlMs;
exports.getPendingCleanupIntervalMs = getPendingCleanupIntervalMs;
exports.isPendingUploadCleanupEnabled = isPendingUploadCleanupEnabled;
function parsePositiveIntEnv(key, fallback) {
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
function getPendingUploadTtlMs() {
    return parsePositiveIntEnv("UPLOAD_PENDING_TTL_MS", 20 * 60 * 1000);
}
function getPendingCleanupIntervalMs() {
    return parsePositiveIntEnv("UPLOAD_PENDING_CLEANUP_INTERVAL_MS", 12 * 60 * 60 * 1000);
}
function isPendingUploadCleanupEnabled() {
    const v = process.env.UPLOAD_PENDING_CLEANUP_ENABLED?.toLowerCase();
    return v !== "false" && v !== "0";
}
//# sourceMappingURL=upload-cleanup.config.js.map