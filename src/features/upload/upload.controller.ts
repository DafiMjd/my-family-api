import { Request, Response } from "express";
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
}

export default new UploadController();
