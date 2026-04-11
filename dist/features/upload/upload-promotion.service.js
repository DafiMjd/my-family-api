"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const person_repository_1 = __importDefault(require("../persons/person.repository"));
const upload_repository_1 = __importDefault(require("./upload.repository"));
const PENDING_PATH = /^\/uploads\/pending\/([^/]+)$/;
function isSafeUploadBasename(name) {
    if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) {
        return false;
    }
    return /^[a-zA-Z0-9._-]+$/.test(name);
}
function parsePendingFilenameFromUrl(urlString) {
    try {
        const u = new URL(urlString);
        const m = u.pathname.match(PENDING_PATH);
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
function permanentUrlFromOriginal(originalUrl, filename) {
    const u = new URL(originalUrl);
    u.pathname = `/uploads/permanent/${filename}`;
    return u.toString();
}
class UploadPromotionService {
    async promoteProfilePictureUrlIfPending(url) {
        if (url === undefined || url === null || url === "") {
            return url;
        }
        const filename = parsePendingFilenameFromUrl(url);
        if (!filename) {
            return url;
        }
        let outcome;
        try {
            outcome = await upload_repository_1.default.movePendingToPermanent(filename);
        }
        catch (error) {
            console.error("[upload-promotion] move failed:", error);
            return url;
        }
        if (outcome === "moved" || outcome === "already_permanent") {
            return permanentUrlFromOriginal(url, filename);
        }
        return url;
    }
    async syncPersonProfilePictureUrl(personId, url) {
        if (url === null || url === "") {
            return;
        }
        const promoted = await this.promoteProfilePictureUrlIfPending(url);
        if (promoted !== url && promoted !== undefined && promoted !== null) {
            await person_repository_1.default.update(personId, { profilePictureUrl: promoted });
        }
    }
}
exports.default = new UploadPromotionService();
//# sourceMappingURL=upload-promotion.service.js.map