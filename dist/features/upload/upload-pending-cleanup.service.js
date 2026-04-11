"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const upload_repository_1 = __importDefault(require("./upload.repository"));
const upload_cleanup_config_1 = require("../../shared/config/upload-cleanup.config");
class UploadPendingCleanupService {
    constructor() {
        this.timer = null;
    }
    start() {
        if (!(0, upload_cleanup_config_1.isPendingUploadCleanupEnabled)()) {
            console.log("[upload-cleanup] Pending TTL job disabled (set UPLOAD_PENDING_CLEANUP_ENABLED=false to skip)");
            return;
        }
        if (this.timer !== null) {
            return;
        }
        const ttlMs = (0, upload_cleanup_config_1.getPendingUploadTtlMs)();
        const intervalMs = (0, upload_cleanup_config_1.getPendingCleanupIntervalMs)();
        console.log(`[upload-cleanup] Pending uploads: TTL=${ttlMs}ms, run every ${intervalMs}ms`);
        void this.runOnce().catch((err) => {
            console.error("[upload-cleanup] Initial run failed:", err);
        });
        this.timer = setInterval(() => {
            void this.runOnce().catch((err) => {
                console.error("[upload-cleanup] Scheduled run failed:", err);
            });
        }, intervalMs);
    }
    async runOnce() {
        const ttlMs = (0, upload_cleanup_config_1.getPendingUploadTtlMs)();
        const removed = await upload_repository_1.default.purgePendingFilesOlderThan(ttlMs);
        if (removed > 0) {
            console.log(`[upload-cleanup] Removed ${removed} expired pending file(s)`);
        }
        return removed;
    }
    stop() {
        if (this.timer !== null) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}
exports.default = new UploadPendingCleanupService();
//# sourceMappingURL=upload-pending-cleanup.service.js.map