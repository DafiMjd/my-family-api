import { query, body } from "express-validator";

const genderEnumValidation = body("gender", "gender must be MAN or WOMAN").isIn(
  ["MAN", "WOMAN"]
);
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

export const updatePersonValidation = [
  body("name", "name is required").optional(),
  body("gender", "gender is required").optional(),
  genderEnumValidation,
  body("birthDate", "birthDate must be a valid date").optional().isDate(),
  body("deathDate", "deathDate must be a valid date").optional().isDate(),
  profilePictureUrlValidation,
];