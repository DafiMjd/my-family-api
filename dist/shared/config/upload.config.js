"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUploadRoot = getUploadRoot;
const path_1 = __importDefault(require("path"));
function getUploadRoot() {
    return process.env.UPLOAD_ROOT ?? path_1.default.join(process.cwd(), "data", "uploads");
}
//# sourceMappingURL=upload.config.js.map