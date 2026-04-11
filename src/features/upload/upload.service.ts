import path from "path";
import crypto from "crypto";
import fs from "fs";
import fsp from "fs/promises";
import type { Request } from "express";
import multer from "multer";
import { getUploadRoot } from "@/shared/config/upload.config";

/** `heic-convert` ships without TypeScript types. */
type HeicConvertFn = (options: {
  buffer: Buffer;
  format: "JPEG" | "PNG";
  quality?: number;
}) => Promise<Buffer>;

// eslint-disable-next-line @typescript-eslint/no-require-imports -- untyped CJS package
const convert = require("heic-convert") as HeicConvertFn;

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/heic": ".heic",
  "image/heif": ".heif",
};

function extensionForFile(mimetype: string, originalname: string): string | null {
  if (ALLOWED_MIMES.has(mimetype)) {
    return EXT_BY_MIME[mimetype] ?? null;
  }
  // iOS / some clients send HEIC as application/octet-stream (do not trust filename for other types)
  if (isAllowedHeicOctetStream(mimetype, originalname)) {
    const ext = path.extname(originalname).toLowerCase();
    return ext === ".heif" ? ".heif" : ".heic";
  }
  return null;
}

function isAllowedHeicOctetStream(mimetype: string, originalname: string): boolean {
  const ext = path.extname(originalname).toLowerCase();
  return (
    (mimetype === "application/octet-stream" || mimetype === "binary/octet-stream") &&
    (ext === ".heic" || ext === ".heif")
  );
}

function buildFilename(mimetype: string, originalname: string): string {
  const ext = extensionForFile(mimetype, originalname) ?? ".bin";
  return `${crypto.randomUUID()}${ext}`;
}

const pendingStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      const pending = path.join(getUploadRoot(), "pending");
      fs.mkdirSync(pending, { recursive: true });
      cb(null, pending);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      cb(error, "");
    }
  },
  filename: (_req, file, cb) => {
    cb(null, buildFilename(file.mimetype, file.originalname));
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowedMime =
    ALLOWED_MIMES.has(file.mimetype) || isAllowedHeicOctetStream(file.mimetype, file.originalname);
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

const pendingUploadMulter = multer({
  storage: pendingStorage,
  limits: { fileSize: MAX_FILE_BYTES, files: 1 },
  fileFilter,
});

/**
 * Full public URL for a file stored under `pending/<filename>`.
 * Set `PUBLIC_BASE_URL` on the VPS (e.g. https://api.example.com) so clients get stable absolute URLs.
 */
function publicBaseUrl(req: Request): string {
  const fromEnv = process.env.PUBLIC_BASE_URL?.trim().replace(/\/$/, "");
  if (fromEnv) {
    return fromEnv;
  }
  const host = req.get("host") ?? "localhost";
  const protocol = req.protocol;
  return `${protocol}://${host}`;
}

function isHeicOrHeifFilename(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ext === ".heic" || ext === ".heif";
}

class UploadService {
  get pendingUploadSingle() {
    return pendingUploadMulter.single("file");
  }

  pendingFilePublicUrl(req: Request, filename: string): string {
    const base = publicBaseUrl(req);
    return `${base}/uploads/pending/${filename}`;
  }

  /**
   * Replaces `.heic` / `.heif` on disk with a JPEG (same UUID stem) so browsers can display the URL.
   * No-op for other types. Mutates `file` to match the new path and metadata.
   */
  async normalizeHeicHeifToJpegIfNeeded(file: Express.Multer.File): Promise<void> {
    if (!isHeicOrHeifFilename(file.filename)) {
      return;
    }

    const inputPath = file.path;
    const inputBuffer = await fsp.readFile(inputPath);

    let jpegBuffer: Buffer;
    try {
      const out = await convert({
        buffer: inputBuffer,
        format: "JPEG",
        quality: 0.88,
      });
      jpegBuffer = Buffer.isBuffer(out) ? out : Buffer.from(out);
    } catch (err) {
      await fsp.unlink(inputPath).catch(() => {});
      throw new Error(
        `HEIC/HEIF could not be converted to JPEG: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    const stem = path.parse(file.filename).name;
    const newFilename = `${stem}.jpg`;
    const newPath = path.join(path.dirname(inputPath), newFilename);

    await fsp.unlink(inputPath);
    await fsp.writeFile(newPath, jpegBuffer);

    file.filename = newFilename;
    file.path = newPath;
    file.mimetype = "image/jpeg";
    file.size = jpegBuffer.length;
  }
}

export default new UploadService();
