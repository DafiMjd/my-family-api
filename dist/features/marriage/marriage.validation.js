"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.personListValidation = exports.cancelDivorceValidation = exports.cancelMarriageValidation = exports.divorceValidation = exports.marryValidation = void 0;
const express_validator_1 = require("express-validator");
exports.marryValidation = [
    (0, express_validator_1.body)("personId1").isUUID().withMessage("personId1 must be a valid UUID"),
    (0, express_validator_1.body)("personId2").isUUID().withMessage("personId2 must be a valid UUID"),
    (0, express_validator_1.body)("startDate")
        .optional()
        .isDate()
        .withMessage("startDate must be a valid ISO 8601 date"),
];
exports.divorceValidation = [
    (0, express_validator_1.body)("personId").isUUID().withMessage("personId must be a valid UUID"),
    (0, express_validator_1.body)("endDate")
        .optional()
        .isDate()
        .withMessage("endDate must be a valid ISO 8601 date"),
];
exports.cancelMarriageValidation = [
    (0, express_validator_1.body)("personId").isUUID().withMessage("personId must be a valid UUID"),
];
exports.cancelDivorceValidation = [
    (0, express_validator_1.body)("personId").isUUID().withMessage("personId must be a valid UUID"),
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