"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const admin_service_1 = __importDefault(require("./admin.service"));
class AdminController {
    async createAdmin(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: "BAD_REQUEST",
                    message: errors.array(),
                });
                return;
            }
            const { username, password } = req.body;
            const admin = await admin_service_1.default.createAdmin(username, password);
            res.status(201).json({
                success: true,
                data: admin,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            const isConflict = message.includes("already exists");
            res.status(isConflict ? 409 : 500).json({
                success: false,
                error: isConflict ? "CONFLICT" : "Failed to create admin",
                message,
            });
        }
    }
}
exports.default = new AdminController();
//# sourceMappingURL=admin.controller.js.map