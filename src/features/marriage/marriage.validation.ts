import { body, query } from "express-validator";
import { HTTP_HTTPS_URL_OPTIONS } from "@/shared/validation/http-url-options";

const startDateValidation = body("startDate")
  .optional()
  .isDate()
  .withMessage("startDate must be a valid ISO 8601 date");

const endDateValidation = body("endDate")
  .optional({ nullable: true })
  .isDate()
  .withMessage("endDate must be a valid ISO 8601 date");

export const marryValidation = [
  body("personId1").isUUID().withMessage("personId1 must be a valid UUID"),
  body("personId2").isUUID().withMessage("personId2 must be a valid UUID"),
  startDateValidation,
  endDateValidation,
];

const createMarryParticipantValidation = (participantPath: "person1" | "person2") => [
  body(participantPath)
    .exists()
    .withMessage(`${participantPath} is required`)
    .isObject()
    .withMessage(`${participantPath} must be an object`),
  body(participantPath).custom((value: any) => {
    const hasPersonId = typeof value?.personId === "string";
    const hasNewPerson = value?.newPerson !== undefined && value?.newPerson !== null;

    if ((hasPersonId && hasNewPerson) || (!hasPersonId && !hasNewPerson)) {
      throw new Error(
        `${participantPath} must provide exactly one of personId or newPerson`
      );
    }
    return true;
  }),
  body(`${participantPath}.personId`)
    .optional()
    .isUUID()
    .withMessage(`${participantPath}.personId must be a valid UUID`),
  body(`${participantPath}.newPerson`)
    .optional()
    .isObject()
    .withMessage(`${participantPath}.newPerson must be an object`),
  body(`${participantPath}.newPerson.parent`)
    .optional({ nullable: true })
    .isObject()
    .withMessage(`${participantPath}.newPerson.parent must be an object`),
  body(`${participantPath}.newPerson.parent.fatherId`)
    .optional()
    .isUUID()
    .withMessage(`${participantPath}.newPerson.parent.fatherId must be a valid UUID`),
  body(`${participantPath}.newPerson.parent.motherId`)
    .optional()
    .isUUID()
    .withMessage(`${participantPath}.newPerson.parent.motherId must be a valid UUID`),
  body(`${participantPath}.newPerson.name`)
    .if(body(`${participantPath}.newPerson`).exists())
    .exists()
    .withMessage(`${participantPath}.newPerson.name is required`)
    .isString()
    .withMessage(`${participantPath}.newPerson.name must be a string`)
    .notEmpty()
    .withMessage(`${participantPath}.newPerson.name must not be empty`),
  body(`${participantPath}.newPerson.gender`)
    .if(body(`${participantPath}.newPerson`).exists())
    .exists()
    .withMessage(`${participantPath}.newPerson.gender is required`)
    .isIn(["MAN", "WOMAN"])
    .withMessage(`${participantPath}.newPerson.gender must be MAN or WOMAN`),
  body(`${participantPath}.newPerson.birthDate`)
    .if(body(`${participantPath}.newPerson`).exists())
    .optional({ nullable: true })
    .isDate()
    .withMessage(`${participantPath}.newPerson.birthDate must be a valid date`),
  body(`${participantPath}.newPerson.deathDate`)
    .if(body(`${participantPath}.newPerson`).exists())
    .optional({ nullable: true })
    .isDate()
    .withMessage(`${participantPath}.newPerson.deathDate must be a valid date`),
  body(`${participantPath}.newPerson.bio`)
    .if(body(`${participantPath}.newPerson`).exists())
    .optional({ nullable: true })
    .isString()
    .withMessage(`${participantPath}.newPerson.bio must be a string`),
  body(`${participantPath}.newPerson.profilePictureUrl`)
    .if(body(`${participantPath}.newPerson`).exists())
    .optional({ nullable: true })
    .isURL(HTTP_HTTPS_URL_OPTIONS)
    .withMessage(`${participantPath}.newPerson.profilePictureUrl must be a valid URL`),
  body(`${participantPath}.newPerson.phoneNumber`)
    .if(body(`${participantPath}.newPerson`).exists())
    .optional({ nullable: true })
    .isString()
    .bail()
    .isLength({ max: 50 })
    .withMessage(`${participantPath}.newPerson.phoneNumber must be a string of at most 50 characters`),
  body(`${participantPath}.newPerson.address`)
    .if(body(`${participantPath}.newPerson`).exists())
    .optional({ nullable: true })
    .isString()
    .bail()
    .isLength({ max: 2000 })
    .withMessage(`${participantPath}.newPerson.address must be a string of at most 2000 characters`),
];

export const marryCreateValidation = [
  ...createMarryParticipantValidation("person1"),
  ...createMarryParticipantValidation("person2"),
  startDateValidation,
  endDateValidation,
];

export const divorceValidation = [
  body("fatherId").isUUID().withMessage("fatherId must be a valid UUID"),
  body("motherId").isUUID().withMessage("motherId must be a valid UUID"),
  body("endDate")
    .optional({ nullable: true })
    .isDate()
    .withMessage("endDate must be a valid ISO 8601 date"),
];

export const cancelMarriageValidation = [
  body("fatherId").isUUID().withMessage("fatherId must be a valid UUID"),
  body("motherId").isUUID().withMessage("motherId must be a valid UUID"),
];

export const cancelDivorceValidation = [
  body("fatherId").isUUID().withMessage("fatherId must be a valid UUID"),
  body("motherId").isUUID().withMessage("motherId must be a valid UUID"),
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
