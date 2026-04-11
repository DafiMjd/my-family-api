"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const upload_config_1 = require("../../shared/config/upload.config");
class UploadRepository {
    pendingDir() {
        return path_1.default.join((0, upload_config_1.getUploadRoot)(), "pending");
    }
    permanentDir() {
        return path_1.default.join((0, upload_config_1.getUploadRoot)(), "permanent");
    }
    async ensurePendingDir() {
        await promises_1.default.mkdir(this.pendingDir(), { recursive: true });
    }
    async movePendingToPermanent(filename) {
        const pendingPath = path_1.default.join(this.pendingDir(), filename);
        const destDir = this.permanentDir();
        const permanentPath = path_1.default.join(destDir, filename);
        await promises_1.default.mkdir(destDir, { recursive: true });
        let destExists = false;
        try {
            await promises_1.default.access(permanentPath);
            destExists = true;
        }
        catch {
            destExists = false;
        }
        let pendingExists = false;
        try {
            await promises_1.default.access(pendingPath);
            pendingExists = true;
        }
        catch {
            pendingExists = false;
        }
        if (!pendingExists && !destExists) {
            return "unavailable";
        }
        if (destExists) {
            if (pendingExists) {
                await promises_1.default.unlink(pendingPath).catch(() => { });
            }
            return "already_permanent";
        }
        try {
            await promises_1.default.rename(pendingPath, permanentPath);
            return "moved";
        }
        catch (err) {
            const code = err.code;
            if (code === "EXDEV") {
                await promises_1.default.copyFile(pendingPath, permanentPath);
                await promises_1.default.unlink(pendingPath);
                return "moved";
            }
            throw err;
        }
    }
}
exports.default = new UploadRepository();
//# sourceMappingURL=upload.repository.js.map