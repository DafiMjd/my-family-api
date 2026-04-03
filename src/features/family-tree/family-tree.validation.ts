import { param, query } from "express-validator";

export const personIdParamValidation = [
  param("personId")
    .exists()
    .withMessage("personId path parameter is required")
    .isUUID()
    .withMessage("personId must be a valid UUID"),
];

export const withSpouseQueryValidation = [
  query("withSpouse")
    .optional()
    .isBoolean()
    .withMessage("withSpouse must be a boolean"),
];
