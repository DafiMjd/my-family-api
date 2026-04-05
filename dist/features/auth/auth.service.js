"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_repository_1 = __importDefault(require("./auth.repository"));
function accessSignOptions() {
    const expiresIn = process.env.JWT_EXPIRES_IN?.trim() && process.env.JWT_EXPIRES_IN.trim().length > 0
        ? process.env.JWT_EXPIRES_IN.trim()
        : "1d";
    return { expiresIn: expiresIn };
}
function refreshSignOptions() {
    const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN?.trim() &&
        process.env.JWT_REFRESH_EXPIRES_IN.trim().length > 0
        ? process.env.JWT_REFRESH_EXPIRES_IN.trim()
        : "7d";
    return { expiresIn: expiresIn };
}
function getJwtSecrets() {
    const accessSecret = process.env.JWT_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!accessSecret || !refreshSecret) {
        throw new Error("JWT authentication is not configured: set JWT_SECRET and JWT_REFRESH_SECRET in the environment");
    }
    return { accessSecret, refreshSecret };
}
function issueTokenPair(admin) {
    const { accessSecret, refreshSecret } = getJwtSecrets();
    const token = jsonwebtoken_1.default.sign({ sub: admin.id, username: admin.username, tokenType: "access" }, accessSecret, accessSignOptions());
    const refreshToken = jsonwebtoken_1.default.sign({ sub: admin.id, tokenType: "refresh" }, refreshSecret, refreshSignOptions());
    return { token, refreshToken };
}
class AuthService {
    async login(username, password) {
        const admin = await auth_repository_1.default.findAdminByUsername(username);
        if (!admin) {
            return null;
        }
        const passwordMatches = await bcrypt_1.default.compare(password, admin.password);
        if (!passwordMatches) {
            return null;
        }
        const { token, refreshToken } = issueTokenPair(admin);
        return {
            id: admin.id,
            username: admin.username,
            token,
            refreshToken,
        };
    }
    async refreshTokens(refreshToken) {
        const { refreshSecret } = getJwtSecrets();
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(refreshToken, refreshSecret);
        }
        catch {
            return null;
        }
        if (payload.tokenType !== "refresh" || typeof payload.sub !== "string" || payload.sub.length === 0) {
            return null;
        }
        const admin = await auth_repository_1.default.findAdminById(payload.sub);
        if (!admin) {
            return null;
        }
        const pair = issueTokenPair(admin);
        return pair;
    }
    verifyAccessToken(token) {
        const accessSecret = process.env.JWT_SECRET;
        if (!accessSecret) {
            throw new Error("JWT authentication is not configured: set JWT_SECRET and JWT_REFRESH_SECRET in the environment");
        }
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(token, accessSecret);
        }
        catch {
            return null;
        }
        if (payload.tokenType !== "access" ||
            typeof payload.sub !== "string" ||
            payload.sub.length === 0 ||
            typeof payload.username !== "string" ||
            payload.username.length === 0) {
            return null;
        }
        return { adminId: payload.sub, username: payload.username };
    }
}
exports.default = new AuthService();
//# sourceMappingURL=auth.service.js.map