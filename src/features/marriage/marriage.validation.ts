import { body, param, query } from "express-validator";

export const marryValidation = [
  body("personId1").isUUID().withMessage("personId1 must be a valid UUID"),
  body("personId2").isUUID().withMessage("personId2 must be a valid UUID"),
  body("startDate")
    .optional()
    .isDate()
    .withMessage("startDate must be a valid ISO 8601 date"),
];

export const divorceValidation = [
  body("personId").isUUID().withMessage("personId must be a valid UUID"),
  body("endDate")
    .optional()
    .isDate()
    .withMessage("endDate must be a valid ISO 8601 date"),
];

export const cancelMarriageValidation = [
  body("personId").isUUID().withMessage("personId must be a valid UUID"),
];

export const cancelDivorceValidation = [
  body("personId").isUUID().withMessage("personId must be a valid UUID"),
];

export const personListValidation = [
  query("status")
    .isIn(["married", "single", "divorced"])
    .withMessage("status must be one of: married, single, divorced"),
  query("gender")
    .optional()
    .isIn(["MAN", "WOMAN"])
    .withMessage("gender must be one of: MAN, WOMAN"),
];
