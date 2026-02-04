import { body, query } from "express-validator";
import { buildCreatePersonValidation } from "../persons/person.validation";

export const createFamilyValidation = [
  body("father")
    .exists()
    .withMessage("father object is required")
    .isObject()
    .withMessage("father must be an object"),
  body("mother")
    .exists()
    .withMessage("mother object is required")
    .isObject()
    .withMessage("mother must be an object"),

  // Reuse person validations for nested father & mother
  // ...buildCreatePersonValidation("father."),
  // ...buildCreatePersonValidation("mother."),

  body("children").isArray().withMessage("children must be an array"),
  body("children.*").isObject().withMessage("Each child must be an object"),
  // ...buildCreatePersonValidation("children.*"),
];

// Validation for creating a family
export const createFamilyByIdValidation = [
  body("fatherId")
    .exists()
    .withMessage("fatherId is required")
    .isString()
    .withMessage("fatherId must be a string"),
  body("motherId")
    .exists()
    .withMessage("motherId is required")
    .isString()
    .withMessage("motherId must be a string"),
  body("childrenIds")
    .exists()
    .withMessage("childrenIds is required")
    .isArray()
    .withMessage("childrenIds must be an array"),
  body("childrenIds.*")
    .isString()
    .withMessage("Each child ID must be a string"),
  body("name").optional().isString().withMessage("name must be a string"),
  body("description")
    .optional()
    .isString()
    .withMessage("description must be a string"),
];

// Validation for updating family children
export const updateFamilyChildrenValidation = [
  body("childrenIds")
    .exists()
    .withMessage("childrenIds is required")
    .isArray()
    .withMessage("childrenIds must be an array"),
  body("childrenIds.*")
    .isString()
    .withMessage("Each child ID must be a string"),
];

// Validation for updating family father
export const updateFamilyFatherValidation = [
  body("fatherId")
    .exists()
    .withMessage("fatherId is required")
    .isString()
    .withMessage("fatherId must be a string"),
];

// Validation for updating family mother
export const updateFamilyMotherValidation = [
  body("motherId")
    .exists()
    .withMessage("motherId is required")
    .isString()
    .withMessage("motherId must be a string"),
];

// Validation for getting families with filters
export const getFamiliesValidation = [
  query("fatherId")
    .optional()
    .isString()
    .withMessage("fatherId must be a string"),
  query("motherId")
    .optional()
    .isString()
    .withMessage("motherId must be a string"),
  query("childrenId")
    .optional()
    .isString()
    .withMessage("childrenId must be a string"),
];
