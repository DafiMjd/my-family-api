"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const promises_1 = __importDefault(require("fs/promises"));
const multer_1 = __importDefault(require("multer"));
const upload_config_1 = require("../../shared/config/upload.config");
const convert = require("heic-convert");
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIMES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
]);
const EXT_BY_MIME = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/heic": ".heic",
    "image/heif": ".heif",
};
function extensionForFile(mimetype, originalname) {
    if (ALLOWED_MIMES.has(mimetype)) {
        return EXT_BY_MIME[mimetype] ?? null;
    }
    if (isAllowedHeicOctetStream(mimetype, originalname)) {
        const ext = path_1.default.extname(originalname).toLowerCase();
        return ext === ".heif" ? ".heif" : ".heic";
    }
    return null;
}
function isAllowedHeicOctetStream(mimetype, originalname) {
    const ext = path_1.default.extname(originalname).toLowerCase();
    return ((mimetype === "application/octet-stream" || mimetype === "binary/octet-stream") &&
        (ext === ".heic" || ext === ".heif"));
}
function buildFilename(mimetype, originalname) {
    const ext = extensionForFile(mimetype, originalname) ?? ".bin";
    return `${crypto_1.default.randomUUID()}${ext}`;
}
const pendingStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        try {
            const pending = path_1.default.join((0, upload_config_1.getUploadRoot)(), "pending");
            fs_1.default.mkdirSync(pending, { recursive: true });
            cb(null, pending);
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            cb(error, "");
        }
    },
    filename: (_req, file, cb) => {
        cb(null, buildFilename(file.mimetype, file.originalname));
    },
});
const fileFilter = (_req, file, cb) => {
    const allowedMime = ALLOWED_MIMES.has(file.mimetype) || isAllowedHeicOctetStream(file.mimetype, file.originalname);
    if (!allowedMime) {
        cb(new Error("Only JPEG, PNG, WebP, GIF, and HEIC/HEIF images are allowed"));
        return;
    }
    if (!extensionForFile(file.mimetype, file.originalname)) {
        cb(new Error("Could not determine a safe file extension for this image"));
        return;
    }
    cb(null, true);
};
const pendingUploadMulter = (0, multer_1.default)({
    storage: pendingStorage,
    limits: { fileSize: MAX_FILE_BYTES, files: 1 },
    fileFilter,
});
function publicBaseUrl(req) {
    const fromEnv = process.env.PUBLIC_BASE_URL?.trim().replace(/\/$/, "");
    if (fromEnv) {
        return fromEnv;
    }
    const host = req.get("host") ?? "localhost";
    const protocol = req.protocol;
    return `${protocol}://${host}`;
}
function isHeicOrHeifFilename(filename) {
    const ext = path_1.default.extname(filename).toLowerCase();
    return ext === ".heic" || ext === ".heif";
}
class UploadService {
    get pendingUploadSingle() {
        return pendingUploadMulter.single("file");
    }
    pendingFilePublicUrl(req, filename) {
        const base = publicBaseUrl(req);
        return `${base}/uploads/pending/${filename}`;
    }
    async normalizeHeicHeifToJpegIfNeeded(file) {
        if (!isHeicOrHeifFilename(file.filename)) {
            return;
        }
        const inputPath = file.path;
        const inputBuffer = await promises_1.default.readFile(inputPath);
        let jpegBuffer;
        try {
            const out = await convert({
                buffer: inputBuffer,
                format: "JPEG",
                quality: 0.88,
            });
            jpegBuffer = Buffer.isBuffer(out) ? out : Buffer.from(out);
        }
        catch (err) {
            await promises_1.default.unlink(inputPath).catch(() => { });
            throw new Error(`HEIC/HEIF could not be converted to JPEG: ${err instanceof Error ? err.message : String(err)}`);
        }
        const stem = path_1.default.parse(file.filename).name;
        const newFilename = `${stem}.jpg`;
        const newPath = path_1.default.join(path_1.default.dirname(inputPath), newFilename);
        await promises_1.default.unlink(inputPath);
        await promises_1.default.writeFile(newPath, jpegBuffer);
        file.filename = newFilename;
        file.path = newPath;
        file.mimetype = "image/jpeg";
        file.size = jpegBuffer.length;
    }
}
exports.default = new UploadService();
//# sourceMappingURL=upload.service.js.map