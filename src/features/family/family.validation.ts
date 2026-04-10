import { body, query } from "express-validator";
import { buildCreateFamilyParentValidation } from "../persons/person.validation";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

/** POST /api/family/one — each child: personId OR newPerson (person fields only; no nested parent/spouse). */
function assertCreateFamilyChildren(children: unknown): void {
  if (!Array.isArray(children)) {
    throw new Error("children must be an array");
  }

  for (let i = 0; i < children.length; i++) {
    const item = children[i];
    const prefix = `children[${i}]`;
    if (!item || typeof item !== "object") {
      throw new Error(`${prefix} must be an object`);
    }
    const row = item as Record<string, unknown>;
    const pid = row.personId;
    const np = row.newPerson;
    const hasPid = typeof pid === "string" && pid.trim().length > 0;
    const hasNp = np != null && typeof np === "object";

    if (hasPid && hasNp) {
      throw new Error(`${prefix}: use only one of personId or newPerson`);
    }
    if (!hasPid && !hasNp) {
      throw new Error(`${prefix}: personId or newPerson is required`);
    }

    if (hasPid) {
      if (!isUuid(pid as string)) {
        throw new Error(`${prefix}.personId must be a valid UUID`);
      }
      continue;
    }

    const child = np as Record<string, unknown>;
    if (typeof child.name !== "string" || !child.name.trim()) {
      throw new Error(`${prefix}.newPerson.name is required`);
    }
    if (child.gender !== "MAN" && child.gender !== "WOMAN") {
      throw new Error(`${prefix}.newPerson.gender must be MAN or WOMAN`);
    }
    if (typeof child.birthDate !== "string" || !child.birthDate.trim()) {
      throw new Error(`${prefix}.newPerson.birthDate is required`);
    }
    if (Number.isNaN(Date.parse(child.birthDate as string))) {
      throw new Error(`${prefix}.newPerson.birthDate must be a valid date`);
    }
    if (child.deathDate != null && child.deathDate !== "") {
      if (typeof child.deathDate !== "string" || Number.isNaN(Date.parse(child.deathDate as string))) {
        throw new Error(`${prefix}.newPerson.deathDate must be a valid date`);
      }
    }
    if (child.bio != null && typeof child.bio !== "string") {
      throw new Error(`${prefix}.newPerson.bio must be a string`);
    }
    if (child.profilePictureUrl != null && child.profilePictureUrl !== "") {
      if (typeof child.profilePictureUrl !== "string") {
        throw new Error(`${prefix}.newPerson.profilePictureUrl must be a string`);
      }
      try {
        new URL(child.profilePictureUrl as string);
      } catch {
        throw new Error(`${prefix}.newPerson.profilePictureUrl must be a valid URL`);
      }
    }
    if (child.parent != null || child.spouse != null) {
      throw new Error(
        `${prefix}.newPerson must not include parent or spouse; parents are body father/mother`
      );
    }
  }
}

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
  ...buildCreateFamilyParentValidation("father."),
  ...buildCreateFamilyParentValidation("mother."),

  body("children").isArray().withMessage("children must be an array"),
  body("children").custom((value) => {
    assertCreateFamilyChildren(value);
    return true;
  }),

  body("name").optional().isString().withMessage("name must be a string"),
  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("description must be a string"),
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
  query("limit")
    .optional()
    .isInt({ min: 1 })
    .withMessage("limit must be a positive integer")
    .toInt(),
  query("offset")
    .optional()
    .isInt({ min: 0 })
    .withMessage("offset must be a non-negative integer")
    .toInt(),
];
