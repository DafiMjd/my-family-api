import { query, body, ValidationChain } from "express-validator";

// Base validators for top-level person fields
const genderEnumValidation = body(
  "gender",
  "gender must be MAN or WOMAN"
).isIn(["MAN", "WOMAN"]);

const profilePictureUrlValidation = body(
  "profilePictureUrl",
  "profilePictureUrl must be a valid URL"
)
  .optional()
  .isURL();

export const createPersonValidation = [
  //   query('gender').optional().isString().withMessage('Gender must be a string'),

  body("name", "name is required").exists(),
  body("gender", "gender is required").exists(),
  genderEnumValidation,
  body("birthDate", "birthDate is required").exists(),
  body("birthDate", "birthDate must be a valid date").isDate(),
  body("deathDate", "deathDate must be a valid date").optional().isDate(),
  profilePictureUrlValidation,
];

// Reusable builder for nested person objects (e.g. family.father, family.children[*])
export const buildCreatePersonValidation = (
  prefix = ""
): ValidationChain[] => [
  body(`${prefix}name`, "name is required").exists(),
  body(`${prefix}gender`, "gender is required").exists(),
  body(
    `${prefix}gender`,
    "gender must be MAN or WOMAN"
  ).isIn(["MAN", "WOMAN"]),
  body(`${prefix}birthDate`, "birthDate is required").exists(),
  body(`${prefix}birthDate`, "birthDate must be a valid date").isDate(),
  body(`${prefix}deathDate`, "deathDate must be a valid date")
    .optional()
    .isDate(),
  body(
    `${prefix}profilePictureUrl`,
    "profilePictureUrl must be a valid URL"
  )
    .optional()
    .isURL(),
];

export const listPersonsQueryValidation = [
  query("name").optional().isString().withMessage("name must be a string"),
  query("gender").optional().isIn(["MAN", "WOMAN"]).withMessage("gender must be MAN or WOMAN"),
];

export const updatePersonValidation = [
  body("name", "name is required").optional(),
  body("gender", "gender is required").optional(),
  genderEnumValidation,
  body("birthDate", "birthDate must be a valid date").optional().isDate(),
  body("deathDate", "deathDate must be a valid date").optional().isDate(),
  profilePictureUrlValidation,
];
