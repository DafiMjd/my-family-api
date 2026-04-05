"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withSpouseQueryValidation = exports.personIdParamValidation = void 0;
const express_validator_1 = require("express-validator");
exports.personIdParamValidation = [
    (0, express_validator_1.param)("personId")
        .exists()
        .withMessage("personId path parameter is required")
        .isUUID()
        .withMessage("personId must be a valid UUID"),
];
exports.withSpouseQueryValidation = [
    (0, express_validator_1.query)("withSpouse")
        .optional()
        .isBoolean()
        .withMessage("withSpouse must be a boolean"),
];
//# sourceMappingURL=family-tree.validation.js.map