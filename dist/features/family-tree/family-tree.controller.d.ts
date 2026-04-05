import { Request, Response } from "express";
declare class FamilyTreeController {
    getRoots(req: Request, res: Response): Promise<void>;
    getChildren(req: Request, res: Response): Promise<void>;
    getClosestRelatedPeople(req: Request, res: Response): Promise<void>;
    getParents(req: Request, res: Response): Promise<void>;
}
declare const _default: FamilyTreeController;
export default _default;
//# sourceMappingURL=family-tree.controller.d.ts.map