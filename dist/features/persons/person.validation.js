"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePersonValidation = exports.deletePersonQueryValidation = exports.latestPersonsQueryValidation = exports.listPersonsQueryValidation = exports.buildCreateFamilyParentValidation = exports.buildCreatePersonValidationIfParentExists = exports.buildCreatePersonValidation = exports.createPersonValidation = void 0;
const express_validator_1 = require("express-validator");
const genderEnumValidation = (0, express_validator_1.body)("gender", "gender must be MAN or WOMAN").isIn(["MAN", "WOMAN"]);
const profilePictureUrlValidation = (0, express_validator_1.body)("profilePictureUrl", "profilePictureUrl must be a valid URL")
    .optional()
    .isURL();
exports.createPersonValidation = [
    (0, express_validator_1.body)("name", "name is required").exists(),
    (0, express_validator_1.body)("gender", "gender is required").exists(),
    genderEnumValidation,
    (0, express_validator_1.body)("birthDate", "birthDate is required").exists(),
    (0, express_validator_1.body)("birthDate", "birthDate must be a valid date").isDate(),
    (0, express_validator_1.body)("deathDate", "deathDate must be a valid date")
        .optional({ nullable: true })
        .isDate(),
    profilePictureUrlValidation,
    (0, express_validator_1.body)("parentId", "parentId must be a valid UUID")
        .optional({ nullable: true })
        .isUUID(),
];
const buildCreatePersonValidation = (prefix = "") => [
    (0, express_validator_1.body)(`${prefix}name`, "name is required").exists(),
    (0, express_validator_1.body)(`${prefix}gender`, "gender is required").exists(),
    (0, express_validator_1.body)(`${prefix}gender`, "gender must be MAN or WOMAN").isIn(["MAN", "WOMAN"]),
    (0, express_validator_1.body)(`${prefix}birthDate`, "birthDate is required").exists(),
    (0, express_validator_1.body)(`${prefix}birthDate`, "birthDate must be a valid date").isDate(),
    (0, express_validator_1.body)(`${prefix}deathDate`, "deathDate must be a valid date")
        .optional({ nullable: true })
        .isDate(),
    (0, express_validator_1.body)(`${prefix}bio`, "bio must be a string")
        .optional({ nullable: true })
        .isString(),
    (0, express_validator_1.body)(`${prefix}profilePictureUrl`, "profilePictureUrl must be a valid URL")
        .optional({ nullable: true })
        .isURL(),
];
exports.buildCreatePersonValidation = buildCreatePersonValidation;
const buildCreatePersonValidationIfParentExists = (fieldPrefix) => {
    const parentPath = fieldPrefix.endsWith(".")
        ? fieldPrefix.slice(0, -1)
        : fieldPrefix;
    const whenPresent = (0, express_validator_1.body)(parentPath).exists().isObject();
    return [
        (0, express_validator_1.body)(`${fieldPrefix}name`)
            .if(whenPresent)
            .trim()
            .notEmpty()
            .withMessage("name is required when spouse is provided"),
        (0, express_validator_1.body)(`${fieldPrefix}gender`)
            .if(whenPresent)
            .exists()
            .withMessage("gender is required when spouse is provided")
            .isIn(["MAN", "WOMAN"])
            .withMessage("gender must be MAN or WOMAN"),
        (0, express_validator_1.body)(`${fieldPrefix}birthDate`)
            .if(whenPresent)
            .exists()
            .withMessage("birthDate is required when spouse is provided")
            .isDate()
            .withMessage("birthDate must be a valid date"),
        (0, express_validator_1.body)(`${fieldPrefix}deathDate`)
            .if(whenPresent)
            .optional({ nullable: true })
            .isDate()
            .withMessage("deathDate must be a valid date"),
        (0, express_validator_1.body)(`${fieldPrefix}bio`)
            .if(whenPresent)
            .optional({ nullable: true })
            .isString(),
        (0, express_validator_1.body)(`${fieldPrefix}profilePictureUrl`)
            .if(whenPresent)
            .optional({ nullable: true })
            .isURL()
            .withMessage("profilePictureUrl must be a valid URL"),
    ];
};
exports.buildCreatePersonValidationIfParentExists = buildCreatePersonValidationIfParentExists;
const buildCreateFamilyParentValidation = (prefix) => [
    (0, express_validator_1.body)(`${prefix}parentId`, "parentId must be a valid UUID")
        .optional({ nullable: true })
        .isUUID(),
    ...(0, exports.buildCreatePersonValidation)(prefix),
];
exports.buildCreateFamilyParentValidation = buildCreateFamilyParentValidation;
exports.listPersonsQueryValidation = [
    (0, express_validator_1.query)("name").optional().isString().withMessage("name must be a string"),
    (0, express_validator_1.query)("gender").optional().isIn(["MAN", "WOMAN"]).withMessage("gender must be MAN or WOMAN"),
    (0, express_validator_1.query)("status").optional().isString().withMessage("status must be a string"),
    (0, express_validator_1.query)("limit").optional().isInt({ min: 1 }).withMessage("limit must be a positive integer").toInt(),
    (0, express_validator_1.query)("offset").optional().isInt({ min: 0 }).withMessage("offset must be a non-negative integer").toInt(),
];
exports.latestPersonsQueryValidation = [
    (0, express_validator_1.query)("limit").optional().isInt({ min: 1 }).withMessage("limit must be a positive integer").toInt(),
    (0, express_validator_1.query)("offset").optional().isInt({ min: 0 }).withMessage("offset must be a non-negative integer").toInt(),
];
exports.deletePersonQueryValidation = [
    (0, express_validator_1.query)("id", "id is required").exists().isUUID().withMessage("id must be a valid UUID"),
    (0, express_validator_1.query)("deleteSpouse")
        .optional()
        .isBoolean()
        .withMessage("deleteSpouse must be a boolean"),
    (0, express_validator_1.query)("deleteChildren")
        .optional()
        .isBoolean()
        .withMessage("deleteChildren must be a boolean"),
];
exports.updatePersonValidation = [
    (0, express_validator_1.body)("name", "name is required").optional(),
    (0, express_validator_1.body)("gender", "gender is required").optional(),
    genderEnumValidation,
    (0, express_validator_1.body)("birthDate", "birthDate must be a valid date").optional().isDate(),
    (0, express_validator_1.body)("deathDate", "deathDate must be a valid date")
        .optional({ nullable: true })
        .isDate(),
    profilePictureUrlValidation,
];
//# sourceMappingURL=person.validation.js.map