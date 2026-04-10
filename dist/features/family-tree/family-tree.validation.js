"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addChildrenValidation = exports.withSpouseQueryValidation = exports.personIdParamValidation = void 0;
const express_validator_1 = require("express-validator");
exports.personIdParamValidation = [
    (0, express_validator_1.param)("personId")
        .exists()
        .withMessage("personId path parameter is required")
        .isUUID()
        .withMessage("personId must be a valid UUID"),
];
exports.withSpouseQueryValidation = [
    (0, express_validator_1.query)("fatherId")
        .optional({ values: "falsy" })
        .isUUID()
        .withMessage("fatherId must be a valid UUID"),
    (0, express_validator_1.query)("motherId")
        .optional({ values: "falsy" })
        .isUUID()
        .withMessage("motherId must be a valid UUID"),
    (0, express_validator_1.query)().custom((_, { req }) => {
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
    (0, express_validator_1.query)("withSpouse")
        .optional()
        .isBoolean()
        .withMessage("withSpouse must be a boolean"),
];
exports.addChildrenValidation = [
    (0, express_validator_1.body)("parent")
        .exists()
        .withMessage("parent is required")
        .isObject()
        .withMessage("parent must be an object"),
    (0, express_validator_1.body)("parent.fatherId")
        .exists()
        .withMessage("parent.fatherId is required")
        .isUUID()
        .withMessage("parent.fatherId must be a valid UUID"),
    (0, express_validator_1.body)("parent.motherId")
        .exists()
        .withMessage("parent.motherId is required")
        .isUUID()
        .withMessage("parent.motherId must be a valid UUID"),
    (0, express_validator_1.body)("children")
        .exists()
        .withMessage("children is required")
        .isArray({ min: 1 })
        .withMessage("children must be a non-empty array"),
    (0, express_validator_1.body)("children.*.name")
        .exists()
        .withMessage("child name is required")
        .isString()
        .withMessage("child name must be a string"),
    (0, express_validator_1.body)("children.*.gender")
        .exists()
        .withMessage("child gender is required")
        .isIn(["MAN", "WOMAN"])
        .withMessage("child gender must be MAN or WOMAN"),
    (0, express_validator_1.body)("children.*.birthDate")
        .exists()
        .withMessage("child birthDate is required")
        .isDate()
        .withMessage("child birthDate must be a valid date (YYYY-MM-DD)"),
    (0, express_validator_1.body)("children.*.deathDate")
        .optional()
        .isDate()
        .withMessage("child deathDate must be a valid date (YYYY-MM-DD)"),
    (0, express_validator_1.body)("children.*.bio")
        .optional()
        .isString()
        .withMessage("child bio must be a string"),
    (0, express_validator_1.body)("children.*.profilePictureUrl")
        .optional()
        .isURL()
        .withMessage("child profilePictureUrl must be a valid URL"),
];
//# sourceMappingURL=family-tree.validation.js.map