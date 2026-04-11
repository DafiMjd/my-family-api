import { Request, Response } from "express";
import uploadOrphanPermanentCleanupService from "./upload-orphan-permanent-cleanup.service";
import uploadService from "./upload.service";

class UploadController {
  /**
   * POST /api/upload/pending — multipart field `file` (single image).
   * Requires JWT. Writes to `<UPLOAD_ROOT>/pending/` and returns a public URL.
   */
  async uploadPending(req: Request, res: Response): Promise<void> {
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
        await uploadService.normalizeHeicHeifToJpegIfNeeded(req.file);
      } catch (convErr) {
        res.status(400).json({
          success: false,
          error: "BAD_REQUEST",
          message: convErr instanceof Error ? convErr.message : "Failed to convert HEIC/HEIF image",
        });
        return;
      }

      const url = uploadService.pendingFilePublicUrl(req, req.file.filename);
      res.status(201).json({
        success: true,
        data: {
          url,
          filename: req.file.filename,
        },
        message: "File uploaded successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to process upload",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * POST /api/upload/cleanup-unreferenced-permanent
   * Requires JWT. Default is dry-run; send `{ "execute": true }` to delete files.
   */
  async cleanupUnreferencedPermanent(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as { execute?: unknown; minAgeMinutes?: unknown };
      const execute = body.execute === true;
      const dryRun = !execute;

      let minAgeMs: number | undefined;
      if (body.minAgeMinutes !== undefined && body.minAgeMinutes !== null) {
        const n = Number(body.minAgeMinutes);
        if (!Number.isFinite(n) || n < 0) {
          res.status(400).json({
            success: false,
            error: "BAD_REQUEST",
            message: "minAgeMinutes must be a non-negative number",
          });
          return;
        }
        minAgeMs = Math.round(n * 60_000);
      }

      const result = await uploadOrphanPermanentCleanupService.run({
        dryRun,
        minAgeMs,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: dryRun
          ? "Dry run complete; no files were deleted. Send { \"execute\": true } to remove orphans."
          : "Cleanup complete.",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

export default new UploadController();
