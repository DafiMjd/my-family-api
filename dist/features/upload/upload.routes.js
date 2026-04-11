"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const upload_controller_1 = __importDefault(require("./upload.controller"));
const upload_service_1 = __importDefault(require("./upload.service"));
const require_access_jwt_middleware_1 = require("../../shared/middleware/require-access-jwt.middleware");
const router = (0, express_1.Router)();
function handleMulterUpload(req, res, next) {
    upload_service_1.default.pendingUploadSingle(req, res, (err) => {
        if (!err) {
            next();
            return;
        }
        if (err instanceof multer_1.default.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                res.status(400).json({
                    success: false,
                    error: "BAD_REQUEST",
                    message: "File exceeds maximum allowed size (5 MB)",
                });
                return;
            }
            res.status(400).json({
                success: false,
                error: "BAD_REQUEST",
                message: err.message,
            });
            return;
        }
        const message = err instanceof Error ? err.message : "Upload failed";
        res.status(400).json({
            success: false,
            error: "BAD_REQUEST",
            message,
        });
    });
}
router.post("", require_access_jwt_middleware_1.requireAccessJwt, handleMulterUpload, upload_controller_1.default.uploadPending.bind(upload_controller_1.default));
exports.default = router;
//# sourceMappingURL=upload.routes.js.map