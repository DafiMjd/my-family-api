"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.personListValidation = exports.cancelDivorceValidation = exports.cancelMarriageValidation = exports.divorceValidation = exports.marryCreateValidation = exports.marryValidation = void 0;
const express_validator_1 = require("express-validator");
const http_url_options_1 = require("../../shared/validation/http-url-options");
const startDateValidation = (0, express_validator_1.body)("startDate")
    .optional()
    .isDate()
    .withMessage("startDate must be a valid ISO 8601 date");
const endDateValidation = (0, express_validator_1.body)("endDate")
    .optional({ nullable: true })
    .isDate()
    .withMessage("endDate must be a valid ISO 8601 date");
exports.marryValidation = [
    (0, express_validator_1.body)("personId1").isUUID().withMessage("personId1 must be a valid UUID"),
    (0, express_validator_1.body)("personId2").isUUID().withMessage("personId2 must be a valid UUID"),
    startDateValidation,
    endDateValidation,
];
const createMarryParticipantValidation = (participantPath) => [
    (0, express_validator_1.body)(participantPath)
        .exists()
        .withMessage(`${participantPath} is required`)
        .isObject()
        .withMessage(`${participantPath} must be an object`),
    (0, express_validator_1.body)(participantPath).custom((value) => {
        const hasPersonId = typeof value?.personId === "string";
        const hasNewPerson = value?.newPerson !== undefined && value?.newPerson !== null;
        if ((hasPersonId && hasNewPerson) || (!hasPersonId && !hasNewPerson)) {
            throw new Error(`${participantPath} must provide exactly one of personId or newPerson`);
        }
        return true;
    }),
    (0, express_validator_1.body)(`${participantPath}.personId`)
        .optional()
        .isUUID()
        .withMessage(`${participantPath}.personId must be a valid UUID`),
    (0, express_validator_1.body)(`${participantPath}.newPerson`)
        .optional()
        .isObject()
        .withMessage(`${participantPath}.newPerson must be an object`),
    (0, express_validator_1.body)(`${participantPath}.newPerson.parent`)
        .optional({ nullable: true })
        .isObject()
        .withMessage(`${participantPath}.newPerson.parent must be an object`),
    (0, express_validator_1.body)(`${participantPath}.newPerson.parent.fatherId`)
        .optional()
        .isUUID()
        .withMessage(`${participantPath}.newPerson.parent.fatherId must be a valid UUID`),
    (0, express_validator_1.body)(`${participantPath}.newPerson.parent.motherId`)
        .optional()
        .isUUID()
        .withMessage(`${participantPath}.newPerson.parent.motherId must be a valid UUID`),
    (0, express_validator_1.body)(`${participantPath}.newPerson.name`)
        .if((0, express_validator_1.body)(`${participantPath}.newPerson`).exists())
        .exists()
        .withMessage(`${participantPath}.newPerson.name is required`)
        .isString()
        .withMessage(`${participantPath}.newPerson.name must be a string`)
        .notEmpty()
        .withMessage(`${participantPath}.newPerson.name must not be empty`),
    (0, express_validator_1.body)(`${participantPath}.newPerson.gender`)
        .if((0, express_validator_1.body)(`${participantPath}.newPerson`).exists())
        .exists()
        .withMessage(`${participantPath}.newPerson.gender is required`)
        .isIn(["MAN", "WOMAN"])
        .withMessage(`${participantPath}.newPerson.gender must be MAN or WOMAN`),
    (0, express_validator_1.body)(`${participantPath}.newPerson.birthDate`)
        .if((0, express_validator_1.body)(`${participantPath}.newPerson`).exists())
        .exists()
        .withMessage(`${participantPath}.newPerson.birthDate is required`)
        .isDate()
        .withMessage(`${participantPath}.newPerson.birthDate must be a valid date`),
    (0, express_validator_1.body)(`${participantPath}.newPerson.deathDate`)
        .if((0, express_validator_1.body)(`${participantPath}.newPerson`).exists())
        .optional({ nullable: true })
        .isDate()
        .withMessage(`${participantPath}.newPerson.deathDate must be a valid date`),
    (0, express_validator_1.body)(`${participantPath}.newPerson.bio`)
        .if((0, express_validator_1.body)(`${participantPath}.newPerson`).exists())
        .optional({ nullable: true })
        .isString()
        .withMessage(`${participantPath}.newPerson.bio must be a string`),
    (0, express_validator_1.body)(`${participantPath}.newPerson.profilePictureUrl`)
        .if((0, express_validator_1.body)(`${participantPath}.newPerson`).exists())
        .optional({ nullable: true })
        .isURL(http_url_options_1.HTTP_HTTPS_URL_OPTIONS)
        .withMessage(`${participantPath}.newPerson.profilePictureUrl must be a valid URL`),
];
exports.marryCreateValidation = [
    ...createMarryParticipantValidation("person1"),
    ...createMarryParticipantValidation("person2"),
    startDateValidation,
    endDateValidation,
];
exports.divorceValidation = [
    (0, express_validator_1.body)("fatherId").isUUID().withMessage("fatherId must be a valid UUID"),
    (0, express_validator_1.body)("motherId").isUUID().withMessage("motherId must be a valid UUID"),
    (0, express_validator_1.body)("endDate")
        .optional({ nullable: true })
        .isDate()
        .withMessage("endDate must be a valid ISO 8601 date"),
];
exports.cancelMarriageValidation = [
    (0, express_validator_1.body)("fatherId").isUUID().withMessage("fatherId must be a valid UUID"),
    (0, express_validator_1.body)("motherId").isUUID().withMessage("motherId must be a valid UUID"),
];
exports.cancelDivorceValidation = [
    (0, express_validator_1.body)("fatherId").isUUID().withMessage("fatherId must be a valid UUID"),
    (0, express_validator_1.body)("motherId").isUUID().withMessage("motherId must be a valid UUID"),
];
exports.personListValidation = [
    (0, express_validator_1.query)("status")
        .isIn(["married", "single", "divorced"])
        .withMessage("status must be one of: married, single, divorced"),
    (0, express_validator_1.query)("gender")
        .optional()
        .isIn(["MAN", "WOMAN"])
        .withMessage("gender must be one of: MAN, WOMAN"),
];
//# sourceMappingURL=marriage.validation.js.map