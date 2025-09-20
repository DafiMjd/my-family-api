import { Request, Response } from 'express';
declare class PersonController {
    getAllPersons(req: Request, res: Response): Promise<void>;
    getPersonById(req: Request, res: Response): Promise<void>;
    createPerson(req: Request, res: Response): Promise<void>;
    updatePerson(req: Request, res: Response): Promise<void>;
    deletePerson(req: Request, res: Response): Promise<void>;
    getPersonsByGender(req: Request, res: Response): Promise<void>;
    getLivingPersons(req: Request, res: Response): Promise<void>;
    getDeceasedPersons(req: Request, res: Response): Promise<void>;
    getPersonCount(req: Request, res: Response): Promise<void>;
}
declare const _default: PersonController;
export default _default;
//# sourceMappingURL=person.controller.d.ts.map