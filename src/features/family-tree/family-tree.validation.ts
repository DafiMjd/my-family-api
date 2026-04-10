import { body, param, query } from "express-validator";

export const personIdParamValidation = [
  param("personId")
    .exists()
    .withMessage("personId path parameter is required")
    .isUUID()
    .withMessage("personId must be a valid UUID"),
];

export const withSpouseQueryValidation = [
  query("fatherId")
    .optional({ values: "falsy" })
    .isUUID()
    .withMessage("fatherId must be a valid UUID"),
  query("motherId")
    .optional({ values: "falsy" })
    .isUUID()
    .withMessage("motherId must be a valid UUID"),
  query().custom((_, { req }) => {
    const f = req.query?.fatherId;
    const m = req.query?.motherId;
    const fStr = typeof f === "string" ? f.trim() : "";
    const mStr = typeof m === "string" ? m.trim() : "";
    const hasF = fStr.length > 0;
    const hasM = mStr.length > 0;
    if (!hasF && !hasM) {
      throw new Error("At least one of fatherId or motherId is required");
    }
    return true;
  }),
  query("withSpouse")
    .optional()
    .isBoolean()
    .withMessage("withSpouse must be a boolean"),
];

export const addChildrenValidation = [
  body("parent")
    .exists()
    .withMessage("parent is required")
    .isObject()
    .withMessage("parent must be an object"),
  body("parent.fatherId")
    .exists()
    .withMessage("parent.fatherId is required")
    .isUUID()
    .withMessage("parent.fatherId must be a valid UUID"),
  body("parent.motherId")
    .exists()
    .withMessage("parent.motherId is required")
    .isUUID()
    .withMessage("parent.motherId must be a valid UUID"),
  body("children")
    .exists()
    .withMessage("children is required")
    .isArray({ min: 1 })
    .withMessage("children must be a non-empty array"),
  body("children.*.name")
    .exists()
    .withMessage("child name is required")
    .isString()
    .withMessage("child name must be a string"),
  body("children.*.gender")
    .exists()
    .withMessage("child gender is required")
    .isIn(["MAN", "WOMAN"])
    .withMessage("child gender must be MAN or WOMAN"),
  body("children.*.birthDate")
    .exists()
    .withMessage("child birthDate is required")
    .isDate()
    .withMessage("child birthDate must be a valid date (YYYY-MM-DD)"),
  body("children.*.deathDate")
    .optional()
    .isDate()
    .withMessage("child deathDate must be a valid date (YYYY-MM-DD)"),
  body("children.*.bio")
    .optional()
    .isString()
    .withMessage("child bio must be a string"),
  body("children.*.profilePictureUrl")
    .optional()
    .isURL()
    .withMessage("child profilePictureUrl must be a valid URL"),
];
