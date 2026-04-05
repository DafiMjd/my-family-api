import { Request, Response } from "express";
declare class MarriageController {
    marry(req: Request, res: Response): Promise<void>;
    divorce(req: Request, res: Response): Promise<void>;
    cancelMarriage(req: Request, res: Response): Promise<void>;
    cancelDivorce(req: Request, res: Response): Promise<void>;
    getPersonsByStatus(req: Request, res: Response): Promise<void>;
    private handleMarriageError;
}
declare const _default: MarriageController;
export default _default;
//# sourceMappingURL=marriage.controller.d.ts.map