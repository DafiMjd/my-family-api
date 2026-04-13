import { body, param, query } from "express-validator";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

/** POST /api/family-tree/add-children — each element: exactly one of personId | newPerson. */
function assertAddChildrenItems(children: unknown): void {
  if (!Array.isArray(children) || children.length === 0) {
    throw new Error("children must be a non-empty array");
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
    if (
      child.birthDate != null &&
      child.birthDate !== "" &&
      (typeof child.birthDate !== "string" || Number.isNaN(Date.parse(child.birthDate as string)))
    ) {
      throw new Error(`${prefix}.newPerson.birthDate must be a valid date`);
    }
    if (child.deathDate != null && child.deathDate !== "") {
      if (typeof child.deathDate !== "string" || Number.isNaN(Date.parse(child.deathDate))) {
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
    if (child.parent != null) {
      throw new Error(
        `${prefix}.newPerson must not include parent; child's parents are request body parent.fatherId and parent.motherId`
      );
    }
  }
}

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
  body("children").custom((value) => {
    assertAddChildrenItems(value);
    return true;
  }),
];
