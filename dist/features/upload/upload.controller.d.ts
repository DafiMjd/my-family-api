import { Request, Response } from "express";
declare class UploadController {
    uploadPending(req: Request, res: Response): Promise<void>;
    cleanupUnreferencedPermanent(req: Request, res: Response): Promise<void>;
}
declare const _default: UploadController;
export default _default;
//# sourceMappingURL=upload.controller.d.ts.map