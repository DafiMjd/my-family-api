"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePersonValidation = exports.listPersonsQueryValidation = exports.buildCreatePersonValidation = exports.createPersonValidation = void 0;
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
    (0, express_validator_1.body)("deathDate", "deathDate must be a valid date").optional().isDate(),
    profilePictureUrlValidation,
];
const buildCreatePersonValidation = (prefix = "") => [
    (0, express_validator_1.body)(`${prefix}name`, "name is required").exists(),
    (0, express_validator_1.body)(`${prefix}gender`, "gender is required").exists(),
    (0, express_validator_1.body)(`${prefix}gender`, "gender must be MAN or WOMAN").isIn(["MAN", "WOMAN"]),
    (0, express_validator_1.body)(`${prefix}birthDate`, "birthDate is required").exists(),
    (0, express_validator_1.body)(`${prefix}birthDate`, "birthDate must be a valid date").isDate(),
    (0, express_validator_1.body)(`${prefix}deathDate`, "deathDate must be a valid date")
        .optional()
        .isDate(),
    (0, express_validator_1.body)(`${prefix}profilePictureUrl`, "profilePictureUrl must be a valid URL")
        .optional()
        .isURL(),
];
exports.buildCreatePersonValidation = buildCreatePersonValidation;
exports.listPersonsQueryValidation = [
    (0, express_validator_1.query)("name").optional().isString().withMessage("name must be a string"),
    (0, express_validator_1.query)("gender").optional().isIn(["MAN", "WOMAN"]).withMessage("gender must be MAN or WOMAN"),
    (0, express_validator_1.query)("limit").optional().isInt({ min: 1 }).withMessage("limit must be a positive integer").toInt(),
    (0, express_validator_1.query)("offset").optional().isInt({ min: 0 }).withMessage("offset must be a non-negative integer").toInt(),
];
exports.updatePersonValidation = [
    (0, express_validator_1.body)("name", "name is required").optional(),
    (0, express_validator_1.body)("gender", "gender is required").optional(),
    genderEnumValidation,
    (0, express_validator_1.body)("birthDate", "birthDate must be a valid date").optional().isDate(),
    (0, express_validator_1.body)("deathDate", "deathDate must be a valid date").optional().isDate(),
    profilePictureUrlValidation,
];
//# sourceMappingURL=person.validation.js.map