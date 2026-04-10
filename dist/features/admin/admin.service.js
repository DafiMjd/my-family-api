"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const admin_repository_1 = __importDefault(require("./admin.repository"));
class AdminService {
    async createAdmin(username, password) {
        const existingAdmin = await admin_repository_1.default.findByUsername(username);
        if (existingAdmin) {
            throw new Error(`Admin with username '${username}' already exists`);
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const createdAdmin = await admin_repository_1.default.create(username, hashedPassword);
        return this.mapToResponse(createdAdmin);
    }
    mapToResponse(admin) {
        return {
            id: admin.id,
            username: admin.username,
            createdAt: admin.createdAt.toISOString(),
            updatedAt: admin.updatedAt.toISOString(),
        };
    }
}
exports.default = new AdminService();
//# sourceMappingURL=admin.service.js.map