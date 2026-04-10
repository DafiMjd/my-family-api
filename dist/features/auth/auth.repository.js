"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../../shared/database/prisma"));
class AuthRepository {
    async findAdminByUsername(username) {
        return await prisma_1.default.admin.findUnique({
            where: { username },
        });
    }
    async findAdminById(id) {
        return await prisma_1.default.admin.findUnique({
            where: { id },
        });
    }
}
exports.default = new AuthRepository();
//# sourceMappingURL=auth.repository.js.map