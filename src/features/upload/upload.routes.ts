import { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import uploadController from "./upload.controller";
import uploadService from "./upload.service";
import { requireAccessJwt } from "@/shared/middleware/require-access-jwt.middleware";

const router = Router();

function handleMulterUpload(req: Request, res: Response, next: NextFunction): void {
  uploadService.pendingUploadSingle(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof multer.MulterError) {
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

// POST /api/upload — save image to pending/; response includes public URL
router.post(
  "",
  requireAccessJwt,
  handleMulterUpload,
  uploadController.uploadPending.bind(uploadController)
);

export default router;
