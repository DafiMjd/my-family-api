import type { Request } from "express";
declare class UploadService {
    get pendingUploadSingle(): import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    pendingFilePublicUrl(req: Request, filename: string): string;
    normalizeHeicHeifToJpegIfNeeded(file: Express.Multer.File): Promise<void>;
}
declare const _default: UploadService;
export default _default;
//# sourceMappingURL=upload.service.d.ts.map