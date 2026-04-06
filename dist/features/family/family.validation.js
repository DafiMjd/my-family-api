"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFamiliesValidation = exports.updateFamilyMotherValidation = exports.updateFamilyFatherValidation = exports.updateFamilyChildrenValidation = exports.createFamilyByIdValidation = exports.createFamilyValidation = void 0;
const express_validator_1 = require("express-validator");
const person_validation_1 = require("../persons/person.validation");
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
    (0, express_validator_1.body)("children.*").isObject().withMessage("Each child must be an object"),
    ...(0, person_validation_1.buildCreatePersonValidation)("children.*."),
    (0, express_validator_1.body)("children.*.spouse")
        .optional({ nullable: true })
        .isObject()
        .withMessage("spouse must be an object when provided"),
    ...(0, person_validation_1.buildCreatePersonValidationIfParentExists)("children.*.spouse."),
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