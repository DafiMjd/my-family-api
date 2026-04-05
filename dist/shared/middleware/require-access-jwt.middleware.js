"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAccessJwt = requireAccessJwt;
const auth_service_1 = __importDefault(require("@/features/auth/auth.service"));
function requireAccessJwt(req, res, next) {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith("Bearer ")) {
            res.status(401).json({
                success: false,
                error: "UNAUTHORIZED",
                message: "Authentication required: send Authorization: Bearer <access_token>",
            });
            return;
        }
        const token = header.slice("Bearer ".length).trim();
        if (!token) {
            res.status(401).json({
                success: false,
                error: "UNAUTHORIZED",
                message: "Authentication required: missing access token",
            });
            return;
        }
        const verified = auth_service_1.default.verifyAccessToken(token);
        if (!verified) {
            res.status(401).json({
                success: false,
                error: "UNAUTHORIZED",
                message: "Invalid or expired access token",
            });
            return;
        }
        next();
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        const isConfigError = message.includes("JWT authentication is not configured");
        res.status(isConfigError ? 503 : 500).json({
            success: false,
            error: isConfigError ? "SERVICE_UNAVAILABLE" : "INTERNAL_SERVER_ERROR",
            message,
        });
    }
}
//# sourceMappingURL=require-access-jwt.middleware.js.map