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
  body("deathDate", "deathDate must be a valid date")
    .optional({ nullable: true })
    .isDate(),
  profilePictureUrlValidation,
  body("parentId", "parentId must be a valid UUID")
    .optional({ nullable: true })
    .isUUID(),
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
      .optional({ nullable: true })
      .isDate(),
    body(`${prefix}bio`, "bio must be a string")
      .optional({ nullable: true })
      .isString(),
    body(
      `${prefix}profilePictureUrl`,
      "profilePictureUrl must be a valid URL"
    )
      .optional({ nullable: true })
      .isURL(),
  ];

/**
 * Validates person-shaped fields under `fieldPrefix` only when the parent path exists
 * (e.g. fieldPrefix `children.*.spouse.` with parent `children.*.spouse`).
 */
export const buildCreatePersonValidationIfParentExists = (
  fieldPrefix: string
): ValidationChain[] => {
  const parentPath = fieldPrefix.endsWith(".")
    ? fieldPrefix.slice(0, -1)
    : fieldPrefix;
  const whenPresent = body(parentPath).exists().isObject();

  return [
    body(`${fieldPrefix}name`)
      .if(whenPresent)
      .trim()
      .notEmpty()
      .withMessage("name is required when spouse is provided"),
    body(`${fieldPrefix}gender`)
      .if(whenPresent)
      .exists()
      .withMessage("gender is required when spouse is provided")
      .isIn(["MAN", "WOMAN"])
      .withMessage("gender must be MAN or WOMAN"),
    body(`${fieldPrefix}birthDate`)
      .if(whenPresent)
      .exists()
      .withMessage("birthDate is required when spouse is provided")
      .isDate()
      .withMessage("birthDate must be a valid date"),
    body(`${fieldPrefix}deathDate`)
      .if(whenPresent)
      .optional({ nullable: true })
      .isDate()
      .withMessage("deathDate must be a valid date"),
    body(`${fieldPrefix}bio`)
      .if(whenPresent)
      .optional({ nullable: true })
      .isString(),
    body(`${fieldPrefix}profilePictureUrl`)
      .if(whenPresent)
      .optional({ nullable: true })
      .isURL()
      .withMessage("profilePictureUrl must be a valid URL"),
  ];
};

/** Father/mother on create-family: person fields + optional parentId (grandparent link). */
export const buildCreateFamilyParentValidation = (
  prefix: string
): ValidationChain[] => [
    body(`${prefix}parentId`, "parentId must be a valid UUID")
      .optional({ nullable: true })
      .isUUID(),
    ...buildCreatePersonValidation(prefix),
  ];

export const listPersonsQueryValidation = [
  query("name").optional().isString().withMessage("name must be a string"),
  query("gender").optional().isIn(["MAN", "WOMAN"]).withMessage("gender must be MAN or WOMAN"),
  query("status").optional().isString().withMessage("status must be a string"),
  query("limit").optional().isInt({ min: 1 }).withMessage("limit must be a positive integer").toInt(),
  query("offset").optional().isInt({ min: 0 }).withMessage("offset must be a non-negative integer").toInt(),
];

export const latestPersonsQueryValidation = [
  query("limit").optional().isInt({ min: 1 }).withMessage("limit must be a positive integer").toInt(),
  query("offset").optional().isInt({ min: 0 }).withMessage("offset must be a non-negative integer").toInt(),
];

export const deletePersonQueryValidation = [
  query("id", "id is required").exists().isUUID().withMessage("id must be a valid UUID"),
  query("deleteSpouse")
    .optional()
    .isBoolean()
    .withMessage("deleteSpouse must be a boolean"),
  query("deleteChildren")
    .optional()
    .isBoolean()
    .withMessage("deleteChildren must be a boolean"),
];

export const updatePersonValidation = [
  body("name", "name is required").optional(),
  body("gender", "gender is required").optional(),
  genderEnumValidation,
  body("birthDate", "birthDate must be a valid date").optional().isDate(),
  body("deathDate", "deathDate must be a valid date")
    .optional({ nullable: true })
    .isDate(),
  profilePictureUrlValidation,
];
