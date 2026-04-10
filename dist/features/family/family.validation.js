"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFamiliesValidation = exports.updateFamilyMotherValidation = exports.updateFamilyFatherValidation = exports.updateFamilyChildrenValidation = exports.createFamilyByIdValidation = exports.createFamilyValidation = void 0;
const express_validator_1 = require("express-validator");
const person_validation_1 = require("../persons/person.validation");
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isUuid(value) {
    return UUID_RE.test(value.trim());
}
function assertCreateFamilyChildren(children) {
    if (!Array.isArray(children)) {
        throw new Error("children must be an array");
    }
    for (let i = 0; i < children.length; i++) {
        const item = children[i];
        const prefix = `children[${i}]`;
        if (!item || typeof item !== "object") {
            throw new Error(`${prefix} must be an object`);
        }
        const row = item;
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
            if (!isUuid(pid)) {
                throw new Error(`${prefix}.personId must be a valid UUID`);
            }
            continue;
        }
        const child = np;
        if (typeof child.name !== "string" || !child.name.trim()) {
            throw new Error(`${prefix}.newPerson.name is required`);
        }
        if (child.gender !== "MAN" && child.gender !== "WOMAN") {
            throw new Error(`${prefix}.newPerson.gender must be MAN or WOMAN`);
        }
        if (typeof child.birthDate !== "string" || !child.birthDate.trim()) {
            throw new Error(`${prefix}.newPerson.birthDate is required`);
        }
        if (Number.isNaN(Date.parse(child.birthDate))) {
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
                new URL(child.profilePictureUrl);
            }
            catch {
                throw new Error(`${prefix}.newPerson.profilePictureUrl must be a valid URL`);
            }
        }
        if (child.parent != null || child.spouse != null) {
            throw new Error(`${prefix}.newPerson must not include parent or spouse; parents are body father/mother`);
        }
    }
}
exports.createFamilyValidation = [
    (0, express_validator_1.body)("father")
        .exists()
        .withMessage("father object is required")
        .isObject()
        .withMessage("father must be an object"),
    (0, express_validator_1.body)("mother")
        .exists()
        .withMessage("mother object is required")
        .isObject()
        .withMessage("mother must be an object"),
    ...(0, person_validation_1.buildCreateFamilyParentValidation)("father."),
    ...(0, person_validation_1.buildCreateFamilyParentValidation)("mother."),
    (0, express_validator_1.body)("children").isArray().withMessage("children must be an array"),
    (0, express_validator_1.body)("children").custom((value) => {
        assertCreateFamilyChildren(value);
        return true;
    }),
    (0, express_validator_1.body)("name").optional().isString().withMessage("name must be a string"),
    (0, express_validator_1.body)("description")
        .optional({ nullable: true })
        .isString()
        .withMessage("description must be a string"),
];
exports.createFamilyByIdValidation = [
    (0, express_validator_1.body)("fatherId")
        .exists()
        .withMessage("fatherId is required")
        .isString()
        .withMessage("fatherId must be a string"),
    (0, express_validator_1.body)("motherId")
        .exists()
        .withMessage("motherId is required")
        .isString()
        .withMessage("motherId must be a string"),
    (0, express_validator_1.body)("childrenIds")
        .exists()
        .withMessage("childrenIds is required")
        .isArray()
        .withMessage("childrenIds must be an array"),
    (0, express_validator_1.body)("childrenIds.*")
        .isString()
        .withMessage("Each child ID must be a string"),
    (0, express_validator_1.body)("name").optional().isString().withMessage("name must be a string"),
    (0, express_validator_1.body)("description")
        .optional()
        .isString()
        .withMessage("description must be a string"),
];
exports.updateFamilyChildrenValidation = [
    (0, express_validator_1.body)("childrenIds")
        .exists()
        .withMessage("childrenIds is required")
        .isArray()
        .withMessage("childrenIds must be an array"),
    (0, express_validator_1.body)("childrenIds.*")
        .isString()
        .withMessage("Each child ID must be a string"),
];
exports.updateFamilyFatherValidation = [
    (0, express_validator_1.body)("fatherId")
        .exists()
        .withMessage("fatherId is required")
        .isString()
        .withMessage("fatherId must be a string"),
];
exports.updateFamilyMotherValidation = [
    (0, express_validator_1.body)("motherId")
        .exists()
        .withMessage("motherId is required")
        .isString()
        .withMessage("motherId must be a string"),
];
exports.getFamiliesValidation = [
    (0, express_validator_1.query)("fatherId")
        .optional()
        .isString()
        .withMessage("fatherId must be a string"),
    (0, express_validator_1.query)("motherId")
        .optional()
        .isString()
        .withMessage("motherId must be a string"),
    (0, express_validator_1.query)("childrenId")
        .optional()
        .isString()
        .withMessage("childrenId must be a string"),
    (0, express_validator_1.query)("limit")
        .optional()
        .isInt({ min: 1 })
        .withMessage("limit must be a positive integer")
        .toInt(),
    (0, express_validator_1.query)("offset")
        .optional()
        .isInt({ min: 0 })
        .withMessage("offset must be a non-negative integer")
        .toInt(),
];
//# sourceMappingURL=family.validation.js.map