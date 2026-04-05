"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = __importDefault(require("./auth.controller"));
const auth_validation_1 = require("./auth.validation");
const router = (0, express_1.Router)();
router.post("/login", auth_validation_1.loginValidation, auth_controller_1.default.login.bind(auth_controller_1.default));
router.post("/refresh-token", auth_validation_1.refreshTokenValidation, auth_controller_1.default.refreshToken.bind(auth_controller_1.default));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map