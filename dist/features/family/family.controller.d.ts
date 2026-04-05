import { Request, Response } from "express";
declare class FamilyController {
    createFamily(req: Request, res: Response): Promise<void>;
    createFamilyById(req: Request, res: Response): Promise<void>;
    getFamilyById(req: Request, res: Response): Promise<void>;
    getFamilies(req: Request, res: Response): Promise<void>;
    updateFamilyChildren(req: Request, res: Response): Promise<void>;
    updateFamilyFather(req: Request, res: Response): Promise<void>;
    updateFamilyMother(req: Request, res: Response): Promise<void>;
    deleteFamily(req: Request, res: Response): Promise<void>;
    private handleError;
}
declare const _default: FamilyController;
export default _default;
//# sourceMappingURL=family.controller.d.ts.map