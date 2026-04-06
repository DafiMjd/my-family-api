import { ValidationChain } from "express-validator";
export declare const createPersonValidation: ValidationChain[];
export declare const buildCreatePersonValidation: (prefix?: string) => ValidationChain[];
export declare const buildCreatePersonValidationIfParentExists: (fieldPrefix: string) => ValidationChain[];
export declare const buildCreateFamilyParentValidation: (prefix: string) => ValidationChain[];
export declare const listPersonsQueryValidation: ValidationChain[];
export declare const latestPersonsQueryValidation: ValidationChain[];
export declare const updatePersonValidation: ValidationChain[];
//# sourceMappingURL=person.validation.d.ts.map