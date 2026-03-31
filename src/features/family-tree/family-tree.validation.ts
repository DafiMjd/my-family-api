import { param } from "express-validator";

export const personIdParamValidation = [
  param("personId")
    .exists()
    .withMessage("personId path parameter is required")
    .isUUID()
    .withMessage("personId must be a valid UUID"),
];
