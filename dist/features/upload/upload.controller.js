"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const upload_service_1 = __importDefault(require("./upload.service"));
class UploadController {
    async uploadPending(req, res) {
        try {
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    error: "BAD_REQUEST",
                    message: 'Image file is required (multipart field name: "file")',
                });
                return;
            }
            try {
                await upload_service_1.default.normalizeHeicHeifToJpegIfNeeded(req.file);
            }
            catch (convErr) {
                res.status(400).json({
                    success: false,
                    error: "BAD_REQUEST",
                    message: convErr instanceof Error ? convErr.message : "Failed to convert HEIC/HEIF image",
                });
                return;
            }
            const url = upload_service_1.default.pendingFilePublicUrl(req, req.file.filename);
            res.status(201).json({
                success: true,
                data: {
                    url,
                    filename: req.file.filename,
                },
                message: "File uploaded successfully",
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: "Failed to process upload",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
}
exports.default = new UploadController();
//# sourceMappingURL=upload.controller.js.map