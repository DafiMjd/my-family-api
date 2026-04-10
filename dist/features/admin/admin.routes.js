"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = __importDefault(require("./admin.controller"));
const admin_validation_1 = require("./admin.validation");
const router = (0, express_1.Router)();
router.post("/one", admin_validation_1.createAdminValidation, admin_controller_1.default.createAdmin.bind(admin_controller_1.default));
exports.default = router;
//# sourceMappingURL=admin.routes.js.map