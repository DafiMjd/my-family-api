"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminValidation = void 0;
const express_validator_1 = require("express-validator");
exports.createAdminValidation = [
    (0, express_validator_1.body)("username")
        .trim()
        .notEmpty()
        .withMessage("Username is required")
        .isLength({ max: 100 })
        .withMessage("Username must be at most 100 characters"),
    (0, express_validator_1.body)("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ max: 500 })
        .withMessage("Password must be at most 500 characters"),
];
//# sourceMappingURL=admin.validation.js.map