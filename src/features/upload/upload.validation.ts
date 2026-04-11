import type { ValidationChain } from "express-validator";

/**
 * Upload routes use multipart form data; size and MIME checks are enforced by multer in `upload.routes.ts`.
 */
export const uploadPendingValidation: ValidationChain[] = [];
