"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../../shared/database/prisma"));
class AdminRepository {
    async findByUsername(username) {
        return await prisma_1.default.admin.findUnique({
            where: { username },
        });
    }
    async create(username, hashedPassword) {
        return await prisma_1.default.admin.create({
            data: {
                username,
                password: hashedPassword,
            },
        });
    }
}
exports.default = new AdminRepository();
//# sourceMappingURL=admin.repository.js.map