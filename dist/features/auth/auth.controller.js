"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const auth_service_1 = __importDefault(require("./auth.service"));
class AuthController {
    async login(req, res) {
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
            const result = await auth_service_1.default.login(username, password);
            if (!result) {
                res.status(401).json({
                    success: false,
                    error: "UNAUTHORIZED",
                    message: "Invalid username or password",
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            const isConfigError = message.includes("JWT authentication is not configured");
            res.status(isConfigError ? 503 : 500).json({
                success: false,
                error: isConfigError ? "SERVICE_UNAVAILABLE" : "Failed to sign in",
                message,
            });
        }
    }
    async refreshToken(req, res) {
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
            const { refreshToken } = req.body;
            const result = await auth_service_1.default.refreshTokens(refreshToken);
            if (!result) {
                res.status(401).json({
                    success: false,
                    error: "UNAUTHORIZED",
                    message: "Invalid or expired refresh token",
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            const isConfigError = message.includes("JWT authentication is not configured");
            res.status(isConfigError ? 503 : 500).json({
                success: false,
                error: isConfigError ? "SERVICE_UNAVAILABLE" : "Failed to refresh token",
                message,
            });
        }
    }
}
exports.default = new AuthController();
//# sourceMappingURL=auth.controller.js.map